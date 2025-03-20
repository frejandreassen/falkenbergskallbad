"use client";
import React from "react";
import { redirect } from "next/navigation";

export default function MembershipRedirectPage() {
  // This page is just a placeholder to redirect to the main site
  React.useEffect(() => {
    redirect("/");
  }, []);

  return (
    <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
      <h1 className="font-bodoni-moda text-3xl mb-10">Omdirigerar...</h1>
    </div>
  );
}