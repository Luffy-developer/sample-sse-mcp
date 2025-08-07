/**
 * 日志打印
 * @param message Message to log
 * @param args Arguments to log
 */
 const log = (message: string, ...args: any[]) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
}
/**
 * 错误格式化
 */
 const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export {
  log,
  formatError
}