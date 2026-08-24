import login from "../actions/login";

export default function Login() {
  return (
    <form action={login}>
      <button>Login</button>
    </form>
  );
}
