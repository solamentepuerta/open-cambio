import { Github, Landmark } from "lucide-react";
import { SiTether } from "react-icons/si";

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
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <a
                        href="https://www.bcv.org.ve/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-primary text-xs font-medium transition-all duration-200 active:scale-95"
                        aria-label="Consultar tasas oficiales en el Banco Central de Venezuela"
                    >
                        <Landmark className="w-3.5 h-3.5" />
                        BCV
                    </a>
                    <a
                        href="https://www.usdt.com.ve/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-[#F0B90B] text-xs font-medium transition-all duration-200 active:scale-95"
                        aria-label="Consultar la tasa USDT a VES en USDT.com.ve"
                    >
                        <SiTether className="w-3.5 h-3.5" />
                        USDT
                    </a>
                    <a
                        href="https://github.com/solamentepuerta/open-cambio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground/80 text-xs font-medium transition-all duration-200 active:scale-95"
                    >
                        <Github className="w-3.5 h-3.5" />
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
}
