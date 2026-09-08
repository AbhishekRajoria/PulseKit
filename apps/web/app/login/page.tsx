import login from "../actions/login";

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
            P
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            PulseKit
          </span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-500">
          Demo authentication to access the dashboard.
        </p>
        <form action={login} className="mt-6">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Continue to dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
