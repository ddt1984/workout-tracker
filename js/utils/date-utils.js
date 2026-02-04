// Date utility functions for Korean format

export const DateUtils = {
    // Convert Date object to Korean display format "M월 D일"
    toKoreanDate(date) {
        const d = new Date(date);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${month}월 ${day}일`;
    },

    // Convert Date object to ISO date string YYYY-MM-DD
    toISODate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Get today's date as ISO string
    getTodayISO() {
        return this.toISODate(new Date());
    },

    // Get today's date in Korean format
    getTodayKorean() {
        return this.toKoreanDate(new Date());
    },

    // Parse Korean date to ISO (requires year)
    koreanToISO(koreanDate, year = new Date().getFullYear()) {
        const match = koreanDate.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
        if (!match) return null;

        const month = String(match[1]).padStart(2, '0');
        const day = String(match[2]).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Format date for display (e.g., "2월 3일 (월요일)")
    formatDateWithDay(date) {
        const d = new Date(date);
        const korean = this.toKoreanDate(d);
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const dayName = days[d.getDay()];
        return `${korean} (${dayName})`;
    },

    // Check if date is today
    isToday(date) {
        const today = this.getTodayISO();
        const checkDate = typeof date === 'string' ? date : this.toISODate(date);
        return today === checkDate;
    },

    // Get relative time string (e.g., "오늘", "어제", "3일 전")
    getRelativeTime(date) {
        const d = new Date(date);
        const today = new Date();
        const diffTime = today - d;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
        return this.toKoreanDate(d);
    }
};
