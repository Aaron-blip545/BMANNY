import * as SecureStore from 'expo-secure-store';

// CHANGE THIS to your own computer's IP address from ipconfig - this
// will be different for every developer on the team, on every network.
const API_BASE_URL = 'http://192.168.1.23:8000/api';

const TOKEN_KEY = 'bmanny_auth_token';

async function getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
}

async function setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * The one place that knows how to talk to the backend. Every screen
 * calls this instead of writing its own fetch() calls - keeps the
 * "attach the token" logic in exactly one place.
 */
async function request(path: string, options: RequestInit = {}) {
    const token = await getToken();

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        // Laravel validation errors come back as { message, errors: {...} }
        const message = data.errors
            ? Object.values(data.errors).flat().join('\n')
            : data.message || 'Something went wrong.';
        throw new Error(message);
    }

    return data;
}

export async function login(email: string, password: string) {
    const data = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    await setToken(data.token);

    return data.user;
}

export async function logout() {
    await clearToken();
}

export async function getProducts() {
    return request('/products');
}

export async function register(data: {
    full_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    business_name: string;
    business_type: string;
    contact_person: string;
    business_address: string;
}) {
    const response = await request('/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    // Backend already returns a token on successful registration - just
    // like login, so we can skip straight to logged-in instead of
    // making the person log in again right after signing up.
    await setToken(response.token);

    return response.user;
}