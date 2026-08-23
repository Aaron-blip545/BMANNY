import * as SecureStore from 'expo-secure-store';

// CHANGE THIS to your own computer's IP address from ipconfig - this
// will be different for every developer on the team, on every network.
const API_BASE_URL = 'http://10.0.2.2:8000/api';

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


export async function getConversations() {
    return request('/conversations');
}

export async function getConversation(otherUserId: number) {
    return request(`/messages/${otherUserId}`);
}

export async function sendMessage(receiverId: number, messageBody: string, inquiryId?: number) {
    return request('/messages', {
        method: 'POST',
        body: JSON.stringify({
            receiver_id: receiverId,
            message_body: messageBody,
            inquiry_id: inquiryId ?? null,
        }),
    });
}

export async function markConversationRead(otherUserId: number) {
    return request(`/messages/${otherUserId}/read`, { method: 'POST' });
}

/**
 * Return the currently logged-in user's profile including their
 * businessClient (client_id) so we don't need a separate request.
 */
export async function getMe() {
    return request('/user');
}

/**
 * Submit a new rebranding / private-label inquiry to the backend.
 * clientId comes from the user's businessClient profile.
 */
export async function submitInquiry(
    clientId: number,
    customizations: {
        packaging_type: string;
        packaging_finish?: string;
        serving_size?: string;
        client_notes?: string;
    }[]
) {
    return request('/inquiries', {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId, customizations }),
    });
}

/**
 * Fetch all orders belonging to the authenticated customer.
 */
export async function getMyOrders() {
    return request('/orders/my-orders');
}

/**
 * Fetch all inquiries submitted by the authenticated customer.
 */
export async function getMyInquiries() {
    return request('/inquiries/my-inquiries');
}

/**
 * Fetch all quotations sent to the authenticated customer.
 */
export async function getMyQuotations() {
    return request('/quotations/my-quotes');
}
