import { account } from './config';
import { ID, OAuthProvider } from 'appwrite';

export interface AuthUser {
    $id: string;
    email: string;
    name: string;
    emailVerification: boolean;
}

export const authService = {
    // Check if session exists
    async hasActiveSession(): Promise<boolean> {
        try {
            await account.get();
            return true;
        } catch {
            return false;
        }
    },

    // Sign up with email and password
    async signUp(email: string, password: string, name: string): Promise<AuthUser> {
        try {
            const user = await account.create(ID.unique(), email, password, name);
            // Create session after signup
            await account.createEmailPasswordSession(email, password);
            // Send verification email
            await this.sendVerificationEmail();
            return user as AuthUser;
        } catch (error) {
            throw error;
        }
    },

    // Send verification email
    async sendVerificationEmail(): Promise<void> {
        try {
            await account.createVerification(`${window.location.origin}/auth/verify`);
        } catch (error) {
            console.log('Could not send verification email:', error);
        }
    },

    // Sign in with email and password
    async signIn(email: string, password: string): Promise<AuthUser> {
        try {
            // Check if already logged in
            const currentUser = await this.getCurrentUser();
            if (currentUser && currentUser.email === email) {
                // Check if email is verified
                if (!currentUser.emailVerification) {
                    throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
                }
                return currentUser;
            }

            // If logged in as different user, logout first
            if (currentUser) {
                await account.deleteSession('current');
            }

            // Create new session
            await account.createEmailPasswordSession(email, password);
            const user = await this.getCurrentUser();

            // Check if email is verified
            if (user && !user.emailVerification) {
                // Send another verification email
                await this.sendVerificationEmail();
                // Delete the session since they're not verified
                await account.deleteSession('current');
                throw new Error('Please verify your email before logging in. We\'ve sent a new verification link to your inbox.');
            }

            return user as AuthUser;
        } catch (error) {
            throw error;
        }
    },

    // Sign in with Google OAuth
    async signInWithGoogle(): Promise<void> {
        try {
            // Check for existing session first
            const hasSession = await this.hasActiveSession();
            if (hasSession) {
                await account.deleteSession('current');
            }

            account.createOAuth2Session(
                OAuthProvider.Google,
                `${window.location.origin}/dashboard`,
                `${window.location.origin}/auth/login`
            );
        } catch (error) {
            throw error;
        }
    },

    // Sign out
    async signOut(): Promise<void> {
        try {
            await account.deleteSession('current');
        } catch (error) {
            // Ignore error if no session exists
            console.log('No session to delete');
        }
    },

    // Get current user
    async getCurrentUser(): Promise<AuthUser | null> {
        try {
            const user = await account.get();
            return user as AuthUser;
        } catch {
            return null;
        }
    },

    // Verify email
    async verifyEmail(userId: string, secret: string): Promise<void> {
        try {
            await account.updateVerification(userId, secret);
        } catch (error) {
            throw error;
        }
    },

    // Send password recovery email
    async sendPasswordRecovery(email: string): Promise<void> {
        try {
            await account.createRecovery(
                email,
                `${window.location.origin}/auth/reset-password`
            );
        } catch (error) {
            throw error;
        }
    },

    // Reset password
    async resetPassword(
        userId: string,
        secret: string,
        password: string
    ): Promise<void> {
        try {
            await account.updateRecovery(userId, secret, password);
        } catch (error) {
            throw error;
        }
    },
};
