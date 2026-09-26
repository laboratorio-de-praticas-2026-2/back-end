"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    src: "/carrossel/slide-4.png  ",
    alt: "Aperto de mãos entre profissionais - fechamento de negócio",
    title: "Nossos Serviços",
    description:
      "Realizamos todo o trabalho necessário para a gestão financeira e fiscal da sua empresa, com competência e credibilidade.",
    buttonText: "Contate-nos",
    buttonHref: "/contato",
  },
  {
    src: "/carrossel/slide-4.png",
    alt: "Descrição do slide 2",
    title: "Assessoria Completa",
    description:
      "Soluções contábeis estratégicas focadas no crescimento sustentável e na redução de custos da sua empresa.",
    buttonText: "Contate-nos",
    buttonHref: "/contato",
  },
  {
    src: "/carrossel/slide-4.png",
    alt: "Descrição do slide 3",
    title: "Planejamento Tributário",
    description:
      "Segurança jurídica e conformidade fiscal para você focar no que realmente importa: seu negócio.",
    buttonText: "Contate-nos",
    buttonHref: "/contato",
  },
];

export default function Carrossel() {
  const [current, setCurrent] = useState(0);

  const goToPrev = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Troca automática de slides a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [current]);

  return (
    <div className="relative w-full h-[500px] md:h-auto md:aspect-[1242/583] overflow-hidden select-none">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === current ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
          }`}
        >
          {/* Imagem de Fundo */}
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={index === 0}
          />

          {/* Overlay escuro para contraste do texto */}
          <div className="absolute inset-0 bg-black/35" />

          {/* Conteúdo sobreposto (Texto e Botão) */}
          <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-20 flex flex-col justify-center items-start text-white">
            <h2 className="text-2xl md:text-5xl font-bold mb-4 drop-shadow-sm">
              {slide.title}
            </h2>
            <p className="text-sm md:text-lg max-w-xl text-gray-100 leading-relaxed mb-6 drop-shadow-sm">
              {slide.description}
            </p>
            <Link
              href={slide.buttonHref}
              className="bg-[#2B7EAA] hover:bg-[#1A4B65] text-white text-sm md:text-base font-semibold py-2.5 px-6 md:py-3 md:px-8 rounded-full shadow-md transition-colors duration-200"
            >
              {slide.buttonText}
            </Link>
          </div>
        </div>
      ))}

      {/* Botão anterior */}
      <button
        onClick={goToPrev}
        aria-label="Slide anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white text-2xl transition z-20"
      >
        ‹
      </button>

      {/* Botão próximo */}
      <button
        onClick={goToNext}
        aria-label="Próximo slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white text-2xl transition z-20"
      >
        ›
      </button>

      {/* Indicadores (bolinhas) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Ir para o slide ${index + 1}`}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === current ? "bg-[#0A324E] w-5" : "bg-white/70 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}