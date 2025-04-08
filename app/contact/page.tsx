import ContactUs from "@/components/contact/ContactUs";
import { Toaster } from "sonner"

export default function ContactPage() {
  return (
    <>
    <ContactUs />
    <Toaster position="bottom-center" richColors></Toaster>
    </>
  )
}