import { Header } from './components/Header';
import Carrossel from './components/Carrossel';
import Publicidade from './components/Publicidade'; // <-- 1. Adicione este import

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-white flex flex-col items-center">
      {/* Cabeçalho */}
      <Header />

      {/* Carrossel */}
      <section className="w-full">
        <Carrossel />
      </section>

      {/* Área de Publicidade */}
      <section className="w-full max-w-[1440px] px-6 lg:px-12 py-8">
        <Publicidade /> {/* <-- 2. Adicione o componente aqui */}
      </section>

      {/* Área reservada para futuras seções */}
      <div className="w-full max-w-[1440px] px-6 lg:px-12 py-16 flex-1">
        {/* Futuras seções e componentes entrarão aqui */}
      </div>
    </main>
  );
}