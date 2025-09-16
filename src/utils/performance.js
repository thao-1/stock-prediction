export const performanceMonitor = {
    startTimer: (name) => {
        const startTime = performance.now();
        return {
            end: () => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                console.log(`${name}: ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    },

    measureApiCall: async (apiFunction, name = 'API Call') => {
        const timer = performanceMonitor.startTimer(name);
        try {
            const result = await apiFunction();
            return result;
        } finally {
            timer.end();
        }
    }
};
