declare module '@yaireo/tagify' {
  export default class Tagify {
    constructor(input: HTMLInputElement | HTMLTextAreaElement, settings?: any);
    
    on(event: string, callback: (e: CustomEvent) => void): this;
    off(event: string, callback?: (e: CustomEvent) => void): this;
    
    destroy(): void;
    removeAllTags(): this;
    addTags(tags: string | string[] | object | object[], clearInput?: boolean, skipInvalid?: boolean): this;
    
    loadOriginalValues(value: string): this;
    
    readonly value: any[];
    readonly DOM: any;
    readonly settings: any;
    readonly dropdown: {
      show(): void;
      hide(): void;
      position(): void;
      readonly isVisible: boolean;
    };
  }
}
