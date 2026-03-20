import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import Image from 'next/image';
import { Logo } from "@/components/ui/logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 mt-1">
            <Logo className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="font-semibold">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-primary font-bold px-6">Comenzar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest">
              <TrendingUp className="h-3 w-3" />
              Acceso al Programa Piloto
            </div>
            <h1 className="text-6xl md:text-7xl font-headline font-black leading-[1.05] tracking-tight text-foreground">
              Domina la Claridad.<br />
              <span className="text-primary">Desbloquea tu Potencial.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              DiaCero proporciona módulos de aprendizaje estructurados y mejorados por IA, diseñados para desarrollar hábitos cognitivos de alto rendimiento en el profesional moderno.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="h-14 px-8 text-lg font-bold bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-transform group">
                  Inicia tu Módulo
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-2">
                Saber Más
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full opacity-50 animate-pulse" />
            <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl ring-8 ring-white">
              <Image 
                src="https://picsum.photos/seed/learn1/1000/1000" 
                alt="Intellectual growth"
                fill
                className="object-cover"
                data-ai-hint="online learning"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white border-y">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-headline font-bold">Aprendizaje Estructurado</h3>
              <p className="text-muted-foreground">Módulos interactivos divididos en segmentos asimilables para prevenir la sobrecarga cognitiva.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-accent/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-headline font-bold">Seguimiento de Progreso</h3>
              <p className="text-muted-foreground">Rastrea automáticamente tu estado de finalización y puntajes de evaluación mientras aprendes.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-headline font-bold">Acceso Seguro</h3>
              <p className="text-muted-foreground">Cuentas personalizadas que garantizan que tu viaje de aprendizaje se mantenga privado y seguro.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto opacity-70 grayscale" />
          </div>
          <p className="text-muted-foreground text-sm">© 2024 DiaCero Learning Systems. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Términos</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-primary transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
