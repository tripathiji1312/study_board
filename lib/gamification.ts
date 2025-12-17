
export const calculateLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const calculateNextLevelXP = (level: number) => {
    return Math.pow(level, 2) * 100;
};

export const calculateProgress = (xp: number, level: number, nextLevelXP: number) => {
    const prevLevelXP = Math.pow(level - 1, 2) * 100;
    return ((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
};
