import { ConsoleOutputEvent } from '@fxmanager/types';

export class LogBuffer {
  private buffer: ConsoleOutputEvent[] = [];
  constructor(private limit: number = 1000) {}

  push(event: ConsoleOutputEvent) {
    this.buffer.push(event);
    if (this.buffer.length > this.limit) this.buffer.shift();
  }

  getHistory() {
    return this.buffer;
  }
}
