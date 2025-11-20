export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center justify-center w-full h-screen">
        <h1 className="text-5xl font-bold text-center text-black dark:text-white">
          Hello World!
        </h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
          Welcome to your Next.js application
        </p>
      </main>
    </div>
  );
}
