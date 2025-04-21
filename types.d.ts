// Declare cheerio module for CommonJS require usage
declare module 'cheerio' {
  interface CheerioAPI {
    (selector: string): CheerioElement;
    load(html: string): CheerioAPI;
  }
  
  interface CheerioElement {
    toArray(): any[];
    map(callback: (index: number, element: any) => any): CheerioElement;
    get(): any[];
    text(): string;
    html(): string;
    attr(name: string): string | undefined;
    find(selector: string): CheerioElement;
    remove(): void;
  }
  
  function load(html: string, options?: any): CheerioAPI;
} 