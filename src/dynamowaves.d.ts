declare class DynamoWave extends HTMLElement {
    constructor();
    connectedCallback(): void;
  }
  
  declare global {
    interface HTMLElementTagNameMap {
      'dynamo-wave': DynamoWave;
    }
  }
  
  export {};