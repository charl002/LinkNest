/**
 * Server-side authentication actions.
 *
 * @function doSocialLogin
 * Authenticates the user using a social provider (e.g., Google) based on the 'action' value from form data.
 * Redirects to the homepage upon successful login.
 *
 * @function doLogout
 * Signs the user out and redirects them to the homepage.
 */
'use server'

import { signIn, signOut } from "@/lib/auth"

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function doSocialLogin(formData: FormData) {
    const action = formData.get('action');
    if (typeof action === 'string') {
        await signIn(action, { redirectTo: "/" });
        console.log(action);
    } else {
        console.error("Invalid action value");
    }
}


export async function doLogout(){
    await signOut({ redirectTo: "/"})
}

import { PostType } from "@/types/post"

export async function getUserByEmail(email: string) {
  const res = await fetch(`${BASE_URL}/api/getsingleuser?email=${encodeURIComponent(email)}`)
  if (!res.ok) {
    return { status: res.status, data: null }
  }
  return await res.json()
}

export async function getUserByUsername(username: string) {
  const res = await fetch(`${BASE_URL}/api/getsingleuser?username=${encodeURIComponent(username)}`)
  return res.status === 404 ? null : await res.json()
}

export async function getAllPosts(): Promise<PostType[]> {
  const [bluesky, news, custom] = await Promise.all([
    fetch(`${BASE_URL}/api/bluesky/getfromdb`),
    fetch(`${BASE_URL}/api/news/getfromdb`),
    fetch(`${BASE_URL}/api/getuserpost`)
  ])

  const [blueskyData, newsData, customData] = await Promise.all([
    bluesky.json(),
    news.json(),
    custom.json()
  ])

  let posts: PostType[] = []
  if (blueskyData.success) posts = posts.concat(blueskyData.posts)
  if (newsData.success) posts = posts.concat(newsData.posts)
  if (customData.success) posts = posts.concat(customData.posts)

  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function submitUser(payload: {
  email: string,
  name: string,
  image: string,
  username: string,
  description: string
}) {
  const res = await fetch(`${BASE_URL}/api/postuser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  return res.ok
}


export async function getAllUsers() {
  const res = await fetch(`${BASE_URL}/api/getalluser`);
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await res.json();
  return data.users;
}

export async function checkAdminStatus(email: string) {
  const res = await fetch(`${BASE_URL}/api/checkadmin?email=${encodeURIComponent(email)}`);
  if (!res.ok) {
    throw new Error('Failed to check admin status');
  }
  const data = await res.json();
  return data.isAdmin;
}