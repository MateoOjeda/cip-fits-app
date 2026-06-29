export function PageLoader() {
  return (
    <div className="h-full w-full min-h-[50vh] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary/10" />
        <div className="absolute h-10 w-10 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase animate-pulse">Cargando</p>
    </div>
  );
}
