export function useInitials() {
    const getInitials = (fullName: string): string => {
        // Safety check: if fullName is missing, return a default initial to prevent the crash
        if (!fullName) return 'A'; 

        const names = fullName.trim().split(' ');

        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();

        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    };

    return getInitials;
}