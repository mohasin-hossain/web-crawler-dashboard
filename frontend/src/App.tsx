import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-purple-800">Web Crawler Dashboard</h1>
        <p className="text-lg text-muted-foreground mb-6">
          A full-stack web application that crawls websites and analyzes their
          structure.
        </p>
        <Button>Get Started</Button>
      </div>
    </div>
  );
}

export default App;
