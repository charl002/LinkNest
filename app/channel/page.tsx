'use client';

import { Toaster } from "sonner";
import dynamic from 'next/dynamic';

const Call = dynamic(() => import('@/components/chat/Call'), {
  ssr: false, // Disable SSR
});

export default function Page(){
    return (
        <main className="flex w-full flex-col">
            <Call/>
            <Toaster position="bottom-center" richColors />
        </main>
    );
};
