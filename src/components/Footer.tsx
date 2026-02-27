import { Github } from "lucide-react";

export default function Footer() {
    return (
        <footer className="mt-10 mb-8 px-2 animate-md3-footer">
            <div className="bg-surface/50 rounded-2xl p-5 text-center">
                <p className="text-xs text-foreground/50 leading-relaxed max-w-sm mx-auto">
                    Proyecto de{" "}
                    <span className="text-foreground/70 font-semibold">código abierto</span>{" "}
                    sin fines de lucro. Creado para traer software funcional,
                    atractivo y poco intrusivo a Venezuela.
                </p>
                <a
                    href="https://github.com/solamentepuerta/open-cambio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full
                               bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground/80
                               text-xs font-medium transition-all duration-200 active:scale-95"
                >
                    <Github className="w-3.5 h-3.5" />
                    Ver en GitHub
                </a>
            </div>
        </footer>
    );
}
