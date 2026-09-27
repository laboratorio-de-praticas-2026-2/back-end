// app/components/Publicidade.tsx
"use client";

import { useState, useEffect } from "react";

export default function Publicidade() {
  const [anuncios, setAnuncios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_CMS_API_URL;

    if (!apiUrl) {
      console.warn("A URL do CMS ainda não foi configurada no .env.local");
      setCarregando(false);
      return;
    }

    // O endpoint é /publicidade e não precisa de token!
    fetch(`${apiUrl}/publicidade`)
      .then((res) => res.json())
      .then((dados) => {
        setAnuncios(dados);
        setCarregando(false);
      })
      .catch((erro) => {
        console.error("Erro ao buscar anúncios:", erro);
        setCarregando(false);
      });
  }, []);

  if (carregando) {
    return (
      <div className="w-full bg-gray-100 py-10 flex items-center justify-center my-8 rounded-lg">
        <p className="text-gray-400">Carregando anúncios...</p>
      </div>
    );
  }

  // O backend já filtra os inativos, então a lista 'anuncios' já são os ativos!
  if (anuncios.length === 0) {
    return null; // Se não tiver anúncio, não mostra nada
  }

  return (
    <div className="w-full flex justify-center my-8">
      <div className="w-full max-w-[1440px] px-6 lg:px-12 flex flex-col gap-6">
        {anuncios.map((anuncio: any) => (
          <a
            key={anuncio.id}
            href="#" // Se o Bruno não mandou campo de link, deixe "#" por enquanto
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block rounded-lg overflow-hidden shadow-md hover:opacity-90 transition-opacity"
          >
            <img
              src={anuncio.urlImagem} // <-- Campo correto do Bruno
              alt={anuncio.titulo}    // <-- Campo correto do Bruno
              className="w-full h-auto object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  );
}