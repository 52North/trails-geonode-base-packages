// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload } from "jwt-decode";
export interface PkceProperties {
    pkceOptions: PkceOptions;
}

export interface PkceOptions {
    clientConfig: ClientConfig;
    pkceConfig: PkceConfiguration; // | WellKnownEndpointUrl;
    refreshOptions: RefreshOptions;
}

export interface RefreshOptions {
    /**
     * Wether to store refresh token.
     */
    storeRefreshToken: boolean;
    /**
     * Whether token refreshing should happen automatically.
     */
    autoRefresh: boolean;
    /**
     * The interval (in milliseconds) at which token refreshing should occur.
     */
    interval: number;
}

export interface ClientConfig {
    /* an array or space-delimited strings */
    scopes?: string;
    redirectUrl: string;
    clientId: string;
}

export interface PkceConfiguration {
    authorizationUrl: string;
    revokeTokenUrl: string;
    tokenUrl: string;
}

export interface OpenIdClaims extends JwtPayload {
    // https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
    /* Subject - Identifier for the End-User at the Issuer.*/
    sub?: string;
    /* End-User's full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User's locale and preferences.*/
    name?: string;
    /* Given name(s) or first name(s) of the End-User. Note that in some cultures, people can have multiple given names; all can be present, with the names being separated by space characters.*/
    given_name?: string;
    /* Surname(s) or last name(s) of the End-User. Note that in some cultures, people can have multiple family names or no family name; all can be present, with the names being separated by space characters.*/
    family_name?: string;
    /* Middle name(s) of the End-User. Note that in some cultures, people can have multiple middle names; all can be present, with the names being separated by space characters. Also note that in some cultures, middle names are not used.*/
    middle_name?: string;
    /* Casual name of the End-User that may or may not be the same as the given_name. For instance, a nickname value of Mike might be returned alongside a given_name value of Michael.*/
    nickname?: string;
    /* Shorthand name by which the End-User wishes to be referred to at the RP, such as janedoe or j.doe. This value MAY be any valid JSON string including special characters such as @, /, or whitespace. The RP MUST NOT rely upon this value being unique, as discussed in Section 5.7.*/
    preferred_username?: string;
    /* URL of the End-User's profile page. The contents of this Web page SHOULD be about the End-User.*/
    profile?: string;
    /* URL of the End-User's profile picture. This URL MUST refer to an image file (for example, a PNG, JPEG, or GIF image file), rather than to a Web page containing an image. Note that this URL SHOULD specifically reference a profile photo of the End-User suitable for displaying when describing the End-User, rather than an arbitrary photo taken by the End-User.*/
    picture?: string;
    /* URL of the End-User's Web page or blog. This Web page SHOULD contain information published by the End-User or an organization that the End-User is affiliated with.*/
    website?: string;
    /* End-User's preferred e-mail address. Its value MUST conform to the RFC 5322 [RFC5322] addr-spec syntax. The RP MUST NOT rely upon this value being unique, as discussed in Section 5.7.*/
    email?: string;
    /* True if the End-User's e-mail address has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this e-mail address was controlled by the End-User at the time the verification was performed. The means by which an e-mail address is verified is context specific, and dependent upon the trust framework or contractual agreements within which the parties are operating.*/
    email_verified?: boolean;
    /* End-User's gender. Values defined by this specification are female and male. Other values MAY be used when neither of the defined values are applicable.*/
    gender?: string;
    /* End-User's birthday, represented as an ISO 8601-1 [ISO8601‑1] YYYY-MM-DD format. The year MAY be 0000, indicating that it is omitted. To represent only the year, YYYY format is allowed. Note that depending on the underlying platform's date related function, providing just year can result in varying month and day, so the implementers need to take this factor into account to correctly process the dates.*/
    birthdate?: string;
    /* String from IANA Time Zone Database [IANA.time‑zones] representing the End-User's time zone. For example, Europe/Paris or America/Los_Angeles.*/
    zoneinfo?: string;
    /* End-User's locale, represented as a BCP47 [RFC5646] language tag. This is typically an ISO 639 Alpha-2 [ISO639] language code in lowercase and an ISO 3166-1 Alpha-2 [ISO3166‑1] country code in uppercase, separated by a dash. For example, en-US or fr-CA. As a compatibility note, some implementations have used an underscore as the separator rather than a dash, for example, en_US; Relying Parties MAY choose to accept this locale syntax as well.*/
    locale?: string;
    /* End-User's preferred telephone number. E.164 [E.164] is RECOMMENDED as the format of this Claim, for example, +1 (425) 555-1212 or +56 (2) 687 2400. If the phone number contains an extension, it is RECOMMENDED that the extension be represented using the RFC 3966 [RFC3966] extension syntax, for example, +1 (604) 555-1234;ext=5678.*/
    phone_number?: string;
    /* True if the End-User's phone number has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this phone number was controlled by the End-User at the time the verification was performed. The means by which a phone number is verified is context specific, and dependent upon the trust framework or contractual agreements within which the parties are operating. When true, the phone_number Claim MUST be in E.164 format and any extensions MUST be represented in RFC 3966 format.*/
    phone_number_verified?: boolean;
    /* object	End-User's preferred postal address. The value of the address member is a JSON [RFC8259] structure containing some or all of the members defined in Section 5.1.1.*/
    address?: object;
    /* Time the End-User's information was last updated. Its value is a JSON number representing the number of seconds from 1970-01-01T00:00:00Z as measured in UTC until the date/time.*/
    updated_at?: number;
}
