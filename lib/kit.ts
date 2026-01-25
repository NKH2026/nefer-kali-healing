// Kit (ConvertKit) Newsletter Integration Service

const KIT_API_KEY = 'cjByPKVBoE9GXVdVi8V6tw';
const KIT_FORM_ID = '8900379';

interface SubscribeOptions {
    email: string;
    firstName?: string;
    lastName?: string;
}

interface SubscribeResult {
    success: boolean;
    message: string;
}

/**
 * Subscribe an email to the Kit newsletter
 */
export async function subscribeToNewsletter(options: SubscribeOptions): Promise<SubscribeResult> {
    const { email, firstName, lastName } = options;

    if (!email || !email.includes('@')) {
        return {
            success: false,
            message: 'Please enter a valid email address'
        };
    }

    try {
        const response = await fetch(
            `https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: KIT_API_KEY,
                    email: email,
                    first_name: firstName || '',
                    fields: {
                        last_name: lastName || ''
                    }
                }),
            }
        );

        const data = await response.json();

        if (response.ok && data.subscription) {
            return {
                success: true,
                message: 'Welcome to our sacred circle! ✨'
            };
        } else {
            console.error('Kit API error:', data);
            return {
                success: false,
                message: data.message || 'Something went wrong. Please try again.'
            };
        }
    } catch (error) {
        console.error('Kit subscription error:', error);
        return {
            success: false,
            message: 'Connection error. Please try again later.'
        };
    }
}
