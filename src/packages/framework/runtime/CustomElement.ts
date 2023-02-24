import { ComponentType } from "react";
import {
    createAbortError,
    createLogger,
    destroyResource,
    Error,
    isAbortError,
    Resource,
    throwAbortError
} from "@open-pioneer/core";
import { ErrorId } from "./errors";
import { ApplicationMetadata, ObservableBox, PackageMetadata } from "./metadata";
import { PackageRepr, createPackages } from "./service-layer/PackageRepr";
import { ServiceLayer } from "./service-layer/ServiceLayer";
import { getErrorChain } from "@open-pioneer/core";
import { ReactIntegration } from "./react-integration/ReactIntegration";
import { ApiMethods, ApiService } from "./api";
import { createManualPromise, ManualPromise } from "./utils";
import { createBuiltinPackage, RUNTIME_API_SERVICE } from "./builtin-services";
import { ReferenceSpec } from "./service-layer/InterfaceSpec";
import { PropertiesRegistry } from "./PropertiesRegistry";
import { AppI18n, initI18n } from "./i18n";
const LOG = createLogger("runtime:CustomElement");

/**
 * Options for the {@link createCustomElement} function.
 */
export interface CustomElementOptions {
    /**
     * Rendered UI component.
     */
    component?: ComponentType<Record<string, string>>;

    /**
     * Application metadata (packages, services etc.).
     * This is usually autogenerated by importing the virtual `"open-pioneer:app"` module.
     */
    appMetadata?: ApplicationMetadata;

    /**
     * Application defined configuration.
     * All instances of the web component will share this static configuration.
     *
     * These will override default properties of the application's packages.
     */
    config?: ApplicationConfig;

    /**
     * Function to provide additional application defined configuration parameters.
     *
     * Compared to {@link config}, this function receives a context object
     * that allows the developer to provide dynamic properties on a per-application basis.
     *
     * Parameters returned by this function take precedence over the ones defined by {@link config}.
     */
    resolveConfig?(ctx: ConfigContext): Promise<ApplicationConfig | undefined>;

    /**
     * Whether the shadow root element is accessible from the outside.
     * Defaults to `false` in production mode and `true` during development to make testing easier.
     */
    openShadowRoot?: boolean;
}

/**
 * A context object that is passed to the `resolveProperties` function.
 */
export interface ConfigContext {
    /**
     * Returns an attribute from the application's root node.
     */
    getAttribute(name: string): string | undefined;
}

/**
 * Runtime application configuration.
 */
export interface ApplicationConfig {
    /**
     * Set this value to a locale string (e.g. "en") to for the application's locale.
     * The default behavior is to choose an appropriate locale for the current user based
     * on the browser's settings.
     *
     * The locale must be supported by the application.
     */
    locale?: string | undefined;

    /**
     * Properties specified here will override default properties of the application's packages.
     */
    properties?: ApplicationProperties | undefined;
}

/**
 * Allows the application to override default properties in all packages.
 */
export interface RawApplicationProperties {
    /**
     * Key: the name of the package.
     * Value: A record of configuration properties (key/value pairs).
     *
     * Properties will override default property values in the package.
     */
    [packageName: string]: Record<string, unknown>;
}

/**
 * Allows the application to override default properties in all packages.
 *
 * Properties are typed when the package contains type definitions for them.
 */
export type ApplicationProperties = RawApplicationProperties & Partial<PropertiesRegistry>;

/**
 * The interface implemented by web components produced via {@link createCustomElement}.
 */
export interface ApplicationElement extends HTMLElement {
    /** Resolves to the element's API when the application has started. */
    when(): Promise<ApiMethods>;
}

/**
 * The class returned by a call to {@link createCustomElement}.
 */
export interface ApplicationElementConstructor {
    new (): ApplicationElement;
}

/**
 * Creates a new custom element class (web component) that can be registered within a DOM.
 *
 * @example
 * ```ts
 * import * as appMetadata from "open-pioneer:app";
 *
 * const CustomElementClazz = createCustomElement({
 *   component: <div>Hello World!</div>,
 *   appMetadata
 * });
 * customElements.define("sample-element", CustomElementClazz);
 * ```
 */
export function createCustomElement(options: CustomElementOptions): ApplicationElementConstructor {
    class PioneerApplication extends HTMLElement implements ApplicationElement {
        #shadowRoot: ShadowRoot;
        #state: ElementState | undefined;

        static get observedAttributes(): string[] {
            return [];
        }

        constructor() {
            super();

            const mode = options.openShadowRoot ?? import.meta.env.DEV ? "open" : "closed";
            this.#shadowRoot = this.attachShadow({
                mode: mode
            });
        }

        connectedCallback() {
            LOG.debug("Launching application");

            if (this.#state) {
                this.#state.destroy();
            }

            this.#state = new ElementState(this, this.#shadowRoot, options);
            this.#state.start();
        }

        disconnectedCallback() {
            LOG.debug("Shutting down application");

            this.#state?.destroy();
            this.#state = undefined;

            LOG.debug("Application destroyed");
        }

        when() {
            if (!this.#state) {
                return Promise.reject(
                    new Error(
                        ErrorId.NOT_MOUNTED,
                        "Cannot use the application's API because the HTML element has not yet been mounted into the DOM."
                    )
                );
            }

            return this.#state.whenAPI();
        }
    }
    return PioneerApplication;
}

class ElementState {
    private hostElement: HTMLElement;
    private shadowRoot: ShadowRoot;
    private options: CustomElementOptions;

    // Public API
    private apiPromise: ManualPromise<ApiMethods> | undefined; // Present when callers are waiting for the API
    private api: ApiMethods | undefined; // Present once started

    private state = "not-started" as "not-started" | "starting" | "started" | "destroyed";
    private locale: string | undefined;
    private container: HTMLDivElement | undefined;
    private config: ApplicationConfig | undefined;
    private serviceLayer: ServiceLayer | undefined;
    private reactIntegration: ReactIntegration | undefined;
    private stylesWatch: Resource | undefined;

    constructor(hostElement: HTMLElement, shadowRoot: ShadowRoot, options: CustomElementOptions) {
        this.hostElement = hostElement;
        this.shadowRoot = shadowRoot;
        this.options = options;
    }

    start() {
        if (this.state !== "not-started") {
            throw new Error(ErrorId.INTERNAL, `Cannot start element in state '${this.state}'`);
        }

        this.state = "starting";
        this.startImpl().catch((e) => {
            // TODO: Error splash?
            this.destroy();
            if (!isAbortError(e)) {
                logError(e);
            }
        });
    }

    destroy() {
        this.state = "destroyed";
        this.apiPromise?.reject(createAbortError());
        this.reactIntegration = destroyResource(this.reactIntegration);
        this.shadowRoot.replaceChildren();
        this.container = undefined;
        this.serviceLayer = destroyResource(this.serviceLayer);
        this.stylesWatch = destroyResource(this.stylesWatch);
    }

    whenAPI(): Promise<ApiMethods> {
        if (this.api) {
            return Promise.resolve(this.api);
        }

        const apiPromise = (this.apiPromise ??= createManualPromise());
        return apiPromise.promise;
    }

    private async startImpl() {
        const { options, shadowRoot, hostElement } = this;

        // Resolve custom application config
        const config = (this.config = await gatherConfig(hostElement, options));
        this.checkAbort();
        LOG.debug("Application config is", config);

        // Decide on locale and load i18n messages (if any).
        const i18n = await initI18n(options.appMetadata, config.locale);
        this.checkAbort();

        // Setup application root node in the shadow dom
        const container = (this.container = createContainer());
        const styles = this.initStyles();
        shadowRoot.replaceChildren(container, styles);

        // Launch the service layer
        const { serviceLayer, packages } = this.initServiceLayer({
            container,
            properties: config.properties,
            i18n
        });
        await this.initAPI(serviceLayer);
        this.checkAbort();

        // Launch react
        this.reactIntegration = new ReactIntegration({
            rootNode: container,
            container: shadowRoot,
            serviceLayer,
            packages
        });
        this.render();
        this.state = "started";

        LOG.debug("Application started");
    }

    private render() {
        this.reactIntegration?.render(this.options.component ?? emptyComponent, {});
    }

    private initStyles() {
        const styles = this.options.appMetadata?.styles;
        const styleNode = document.createElement("style");
        applyStyles(styleNode, styles);
        if (import.meta.hot) {
            this.stylesWatch = styles?.on?.("changed", () => {
                LOG.debug("Application styles changed");
                applyStyles(styleNode, styles);
            });
        }
        return styleNode;
    }

    private initServiceLayer(config: {
        container: HTMLDivElement;
        properties: ApplicationProperties;
        i18n: AppI18n;
    }) {
        const options = this.options;
        const { container, properties, i18n } = config;
        const packageMetadata = options.appMetadata?.packages ?? {};
        const builtinPackage = createBuiltinPackage({
            host: this.hostElement,
            shadowRoot: this.shadowRoot,
            container: container,
            locale: i18n.locale,
            supportedLocales: i18n.supportedLocales
        });
        const { serviceLayer, packages } = createServiceLayer({
            packageMetadata,
            builtinPackage,
            properties,
            i18n
        });
        this.serviceLayer = serviceLayer;

        if (LOG.isDebug()) {
            LOG.debug("Launching service layer with packages", Object.fromEntries(packages));
        }
        serviceLayer.start();
        return { serviceLayer, packages };
    }

    private async initAPI(serviceLayer: ServiceLayer) {
        const result = serviceLayer.getService(
            "@open-pioneer/runtime",
            {
                interfaceName: RUNTIME_API_SERVICE
            },
            { ignoreDeclarationCheck: true }
        );
        if (result.type !== "found") {
            throw new Error(
                ErrorId.INTERNAL,
                `Failed to find instance of 'runtime.ApiService' (result type '${result.type}').` +
                    ` This is a builtin service that must be present exactly once.`
            );
        }

        const apiService = result.value.getInstanceOrThrow() as ApiService;
        try {
            const api = (this.api = await apiService.getApi());
            LOG.debug("Application API initialized to", api);
            this.apiPromise?.resolve(api);
        } catch (e) {
            throw new Error(ErrorId.INTERNAL, "Failed to gather the application's API methods.", {
                cause: e
            });
        }
    }

    private checkAbort() {
        if (this.state === "destroyed") {
            throwAbortError();
        }
    }
}

function createContainer() {
    // Setup application root node in the shadow dom
    const container = document.createElement("div");
    container.classList.add("pioneer-root");
    container.style.minHeight = "100%";
    container.style.height = "100%";
    return container;
}

function createServiceLayer(config: {
    packageMetadata: Record<string, PackageMetadata> | undefined;
    properties: ApplicationProperties;
    builtinPackage: PackageRepr;
    i18n: AppI18n;
}) {
    const { packageMetadata, properties, builtinPackage, i18n } = config;

    let packages: PackageRepr[];
    try {
        packages = createPackages(packageMetadata ?? {}, i18n, properties);
    } catch (e) {
        throw new Error(ErrorId.INVALID_METADATA, "Failed to parse package metadata.", {
            cause: e
        });
    }

    // Add builtin services defined within this package.
    {
        const index = packages.findIndex((pkg) => pkg.name === builtinPackage.name);
        if (index >= 0) {
            packages.splice(index, 1);
        }
        packages.push(builtinPackage);
    }

    const forcedReferences: ReferenceSpec[] = [
        {
            interfaceName: RUNTIME_API_SERVICE
        }
    ];
    const serviceLayer = new ServiceLayer(packages, forcedReferences);
    return {
        packages: new Map(packages.map((pkg) => [pkg.name, pkg])),
        serviceLayer: serviceLayer
    };
}

/**
 * Gathers application properties by reading them from the options object
 * and by (optionally) invoking the `resolveProperties` hook.
 */
async function gatherConfig(hostElement: HTMLElement, options: CustomElementOptions) {
    let configs: ApplicationConfig[];
    try {
        configs = [
            options.config ?? {},
            (await options.resolveConfig?.({
                getAttribute(name) {
                    return hostElement.getAttribute(name) ?? undefined;
                }
            })) ?? {}
        ];
    } catch (e) {
        throw new Error(
            ErrorId.CONFIG_RESOLUTION_FAILED,
            "Failed to resolve application properties.",
            {
                cause: e
            }
        );
    }

    return mergeConfigs(configs);
}

/**
 * Merges application configurations into a single object.
 * Properties / config parameters at a later position overwrite properties from earlier ones.
 */
function mergeConfigs(configs: ApplicationConfig[]): Required<ApplicationConfig> {
    // Merge simple values by assigning them in order
    const mergedConfig: Required<ApplicationConfig> = Object.assign(
        {
            locale: undefined,
            properties: {}
        } satisfies ApplicationConfig,
        ...configs
    );

    // Deep merge for application properties
    const mergedProperties: ApplicationProperties = (mergedConfig.properties = {});
    for (const config of configs) {
        for (const [packageName, packageProperties] of Object.entries(config.properties ?? {})) {
            const mergedPackageProps = (mergedProperties[packageName] ??= {});
            Object.assign(mergedPackageProps, packageProperties);
        }
    }

    return mergedConfig;
}

const DISABLE_INHERIT = ":host { all: initial; display: block; }";

// Applies application styles to the given style node.
// Can be called multiple times in development mode to implement hot reloading.
function applyStyles(styleNode: HTMLStyleElement, styles: ObservableBox<string> | undefined) {
    const cssValue = styles?.value ?? "";
    const cssNode = document.createTextNode([DISABLE_INHERIT, cssValue].join("\n"));
    styleNode.replaceChildren(cssNode);
}

function logError(e: unknown) {
    if (e instanceof Error) {
        const chain = getErrorChain(e).reverse();
        if (chain.length === 1) {
            console.error(e);
            return;
        }

        let n = 1;
        for (const error of chain) {
            console.error(`#${n}`, error);
            ++n;
        }
    } else {
        console.error("Unexpected error", e);
    }
}

function emptyComponent() {
    return null;
}
