import React, { useState } from "react";

export default function GoogleChooserPage() {
  const [useCustom, setUseCustom] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const accounts = [
    { name: "Aditya Sharma", email: "aditya@build.com", initials: "AS", color: "bg-blue-600" },
    { name: "Sneha Patel", email: "sneha@build.com", initials: "SP", color: "bg-green-600" },
    { name: "Rohan Das", email: "rohan@build.com", initials: "RD", color: "bg-purple-600" },
    { name: "Tanya Iyer", email: "tanya@build.com", initials: "TI", color: "bg-red-650" }
  ];

  const handleSelect = (selectedEmail: string, selectedName: string) => {
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "GOOGLE_AUTH_SUCCESS",
          email: selectedEmail,
          name: selectedName
        },
        window.location.origin
      );
      window.close();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    handleSelect(email, name);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Google G logo header */}
        <div className="text-center space-y-2">
          <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
            <path
              fill="#ea4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.488 0-6.315-2.827-6.315-6.315s2.827-6.315 6.315-6.315c1.558 0 2.978.568 4.076 1.503l3.056-3.056C19.14 2.308 15.932 1 12.24 1 5.926 1 12.24s4.926 11.24 11.24 11.24c6.315 0 11.24-4.925 11.24-11.24 0-.756-.08-1.488-.22-2.195H12.24z"
            />
          </svg>
          <h2 className="text-lg font-bold text-white tracking-tight">Choose an account</h2>
          <p className="text-xs text-neutral-400">to continue to <span className="text-brand-yellow font-bold">BUILD</span></p>
        </div>

        {!useCustom ? (
          <div className="space-y-4">
            <div className="space-y-1.5 divide-y divide-neutral-800/80">
              {accounts.map((acc, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(acc.email, acc.name)}
                  className="w-full py-3.5 flex items-center gap-3 hover:bg-neutral-950/40 rounded-xl px-2 text-left transition-colors cursor-pointer group"
                >
                  <div className={`w-8 h-8 rounded-full ${acc.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                    {acc.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white block group-hover:text-brand-yellow transition-colors">{acc.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono block truncate">{acc.email}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setUseCustom(true)}
              className="w-full py-3 bg-neutral-950 border border-neutral-850 hover:border-brand-yellow rounded-xl text-xs font-bold text-neutral-300 transition-all cursor-pointer"
            >
              Use another account
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Google Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs rounded-lg text-white focus:outline-none focus:border-brand-yellow"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Google Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. john.doe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs rounded-lg text-white focus:outline-none focus:border-brand-yellow"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-brand-yellow text-neutral-950 rounded-xl text-xs font-bold hover:bg-yellow-400 transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setUseCustom(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-xl text-xs"
              >
                Back
              </button>
            </div>
          </form>
        )}

        <div className="text-[10px] text-neutral-500 leading-normal border-t border-neutral-850/80 pt-4">
          To continue, Google will share your name, email address, language preference, and profile picture with BUILD.
        </div>
      </div>
    </div>
  );
}
