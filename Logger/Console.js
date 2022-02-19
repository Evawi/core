import { IsDev } from '../../../conf/main';

class ConsoleLogger {
  _isDev = () => {
    return IsDev;
  };
  log = (...logs) => {
    if (this._isDev()) {
      console.groupCollapsed('Dev log');
      console.log(...logs);
      console.groupCollapsed('trace');
      console.trace();
      console.groupEnd();
      console.groupEnd();
    }
    return;
  };
  alweysLog = (...logs) => {
    console.groupCollapsed('Alweys log');
    console.log(...logs);
    console.groupCollapsed('trace');
    console.trace();
    console.groupEnd();
    console.groupEnd();
  };
}
const ConsoleClass = new ConsoleLogger();

export default ConsoleClass;
