"use client";

import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";

export default function AnnouncementPopup() {
    const [show, setShow] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // Mostrar después de 1.5 segundos para no interrumpir visualmente la carga inicial
        const timer = setTimeout(() => {
            const hasSeen = localStorage.getItem("announcement_3months_v1");
            if (!hasSeen) {
                setShow(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShow(false);
            localStorage.setItem("announcement_3months_v1", "true");
        }, 400); // Dar tiempo a la animación de salida
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
            {/* Toast Box flotante */}
            <div
                className={`relative bg-surface/10 backdrop-blur-xl text-on-surface rounded-3xl p-5 shadow-2xl max-w-sm w-full pointer-events-auto border border-white/20 transition-all duration-500 ease-out transform ${isClosing ? "translate-y-8 opacity-0 scale-95" : "translate-y-0 opacity-100 scale-100 animate-[slideUp_0.5s_cubic-bezier(0.2,0,0,1)_both]"
                    }`}
            >
                {/* Botón cerrar */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4 opacity-70" />
                </button>

                <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 shrink-0 bg-primary/20 text-primary rounded-full flex items-center justify-center mt-0.5">
                        <Heart className="w-5 h-5 fill-primary/30" />
                    </div>

                    <div className="flex-1 pt-0.5">
                        <h3 className="text-sm font-bold font-display mb-1.5 text-foreground/90 pr-4">
                            ¡Gracias por su apoyo! 🎉
                        </h3>
                        <div className="text-xs text-foreground/70 space-y-2 leading-relaxed">
                            <p>
                                Ya somos <strong>más de 200 usuarios diarios</strong>. Gracias a sus aportes en GitHub y redes, hoy actualizamos el historial para que sea completamente funcional.
                            </p>
                            <p>
                                Tras 3 meses, reafirmamos que Open Cambio seguirá siendo <strong>open-source y libre de anuncios</strong>. ¡Gracias totales!
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="mt-3 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
