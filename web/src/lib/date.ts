/**
 * 获取指定时区的 "今天" 日期（午夜 UTC 表示）
 * 默认使用洛杉矶时区
 */
export function getToday(timezone = 'America/Los_Angeles'): Date {
    const now = new Date();
    // 用 Intl 格式化获取该时区的日期字符串 (YYYY-MM-DD)
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now); // returns "2026-03-03"

    // 解析为 UTC 午夜的 Date 对象
    return new Date(parts + 'T00:00:00.000Z');
}

/**
 * 获取指定时区的本月第一天
 */
export function getFirstOfMonth(timezone = 'America/Los_Angeles'): Date {
    const today = getToday(timezone);
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
}
