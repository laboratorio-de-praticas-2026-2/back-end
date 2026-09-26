// app/components/Publicidade.tsx
import Image from 'next/image';
import Link from 'next/link';

const anunciosFalsos = [
  { id: 1, imagem: 'https://picsum.photos/1200/200?random=1', link: '#', alt: 'Anúncio 1' },
];

export default function Publicidade() {
  return (
    <div className="w-full flex justify-center my-8">
      {anunciosFalsos.map((anuncio) => (
        <Link key={anuncio.id} href={anuncio.link} target="_blank" className="w-full">
          <img 
            src={anuncio.imagem} 
            alt={anuncio.alt} 
            className="w-full h-auto object-cover rounded-lg shadow-md hover:opacity-90 transition-opacity" 
          />
        </Link>
      ))}
    </div>
  );
}