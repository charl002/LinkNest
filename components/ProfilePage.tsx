"use client";

export default function ProfilePage( { user }: { user: string } ) {

  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{user} Profile</h1>
      </div>
    );
}