import { ApiExtension } from "@open-pioneer/runtime";

export class SecondApiExtension implements ApiExtension {
    async getApiMethods() {
        return {
            // method to test duplicate api methods (! do not comment in and commit)
            /*changeText: (text: string) => {
                console.warn("duplicate changeText method called");
            },*/

            justAnotherApiMethod: () => {
                console.log("justAnotherApiMethod");
            }
        };
    }
}
