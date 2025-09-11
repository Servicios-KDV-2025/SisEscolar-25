export type SchoolCycleType = {
    _id: string,
    _creationTime: number;
    name: string;
    status: "active" | "inactive" | "archived";
    createdAt: number;
    updatedAt: number;
    schoolId: string;
    startDate: number;
    endDate: number;
}

export type SubjectType = {
    _id: string;
    name: string;
    description?: string;
    status: string;
};

export type TermType = {
    _id: string;
    schoolCycleId: string;
    name: string,
    key: string,
    startDate: number,
    endDate: number,
    status: "active" | "inactive" | "closed";
    updatedAt?: number;
}

export type ClassroomType = {
    _creationTime: number;
    location?: string | undefined;
    name: string;
    status: "active" | "inactive";
    createdAt: number;
    updatedAt: number;
    schoolId: string;
    capacity: number;
    id: string;
};

export type TeacherType = {
    _id: string;
    _creationTime: number;
    lastName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    birthDate?: number | undefined;
    admissionDate?: number | undefined;
    imgUrl?: string | undefined;
    status?: "active" | "inactive" | undefined;
    name: string;
    email: string;
    clerkId: string;
    createdAt: number;
    updatedAt: number;
}

export type GroupType = {
    _id: string;
    name: string;
    grade: string;
    status: string;
};

export type CreateBy = {
    _id: string;
    _creationTime: number;
    lastName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    birthDate?: number | undefined;
    admissionDate?: number | undefined;
    imgUrl?: string | undefined;
    status?: "active" | "inactive" | undefined;
    name: string;
    email: string;
    clerkId: string;
    createdAt: number;
    updatedAt: number;
}