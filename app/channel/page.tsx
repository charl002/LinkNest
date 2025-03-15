'use client';

import { Toaster } from "sonner";
import Call from "@/components/chat/Call";

export default function Page(){
    return (
        <main className="flex w-full flex-col">
            <Call/>
            <Toaster position="bottom-center" richColors />
        </main>
    );
};
