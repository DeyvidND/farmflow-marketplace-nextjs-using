import { redirect } from "next/navigation";

/** /karta merged into /farmers (the explorer now lives there, with a
 *  Производители/Карта tab toggle). This redirect just keeps old links
 *  and bookmarks working. */
export default function KartaPage() {
  redirect("/farmers");
}
