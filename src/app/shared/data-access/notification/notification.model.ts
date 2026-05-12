export interface Notification {
    _id: string;
    message: string;
    forAllUsers: boolean;
    readBy: string[];
    deletedBy: string[];
    createdAt: string;
    updatedAt: string;
  }
  