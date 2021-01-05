/**
 * Config SSR render for the resource name
 */
declare function SSRResourceConstructor(options: {
    /** Server's origin host name */
    origin: string; 
    /** Pathname for the root of the SSR page */
    resourceName: string; 
    /** Path to the html file for SSR */
    htmlFile: string; 
    /** Check to enable live reload SSR page while developing */
    development?: boolean; 
    /** The NodeJS server to link to Live reload system */
    server?: Object;
    /** Maximum time to wait before stopping page rendering */
    waitingTime?: number
}): (pathname: string) => Promise<{
    /** The rendered html page */
    html: string;
    /** The status code of this page */
    statusCode: number;
}>

declare namespace SSRResourceConstructor {
    /**
     * Render page by name
     * @param {string} pathname The name of the rendered page
     * @return {Promise<RenderedPage>} The rendered html page and the status code of this page
     */
    declare type renderPage = (pathname: string) => Promise<{
        /** The rendered html page */
        html: string;
        /** The status code of this page */
        statusCode: number;
    }>

    declare type SSROptions = {
        /** Server's origin host name */
        origin: string; 
        /** Pathname for the root of the SSR page */
        resourceName: string; 
        /** Path to the html file for SSR */
        htmlFile: string; 
        /** Check to enable live reload SSR page while developing */
        development?: boolean; 
        /** The NodeJS server to link to Live reload system */
        server?: Object;
        /** Maximum time to wait before stopping page rendering */
        waitingTime?: number
    }
    
    declare type RenderedPage = {
        /** The rendered html page */
        html: string;
        /** The status code of this page */
        statusCode: number;
    }
    
    declare type RenderPage = (pathname: string) => Promise<RenderedPage>
}

export = SSRResourceConstructor