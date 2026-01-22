import { Client, Account, Databases, Storage } from 'appwrite';

export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  collections: {
    users: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
    eventTypes: process.env.NEXT_PUBLIC_APPWRITE_EVENT_TYPES_COLLECTION_ID!,
    availability: process.env.NEXT_PUBLIC_APPWRITE_AVAILABILITY_COLLECTION_ID!,
    bookings: process.env.NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
    callNotes: process.env.NEXT_PUBLIC_APPWRITE_CALL_NOTES_COLLECTION_ID!,
    callDocuments: process.env.NEXT_PUBLIC_APPWRITE_CALL_DOCUMENTS_COLLECTION_ID!,
  },
  buckets: {
    avatars: process.env.NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID!,
    callDocuments: process.env.NEXT_PUBLIC_APPWRITE_CALL_DOCUMENTS_BUCKET_ID!,
  },
};

const client = new Client();

if (appwriteConfig.endpoint) {
  client.setEndpoint(appwriteConfig.endpoint);
}

if (appwriteConfig.projectId) {
  client.setProject(appwriteConfig.projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client };
