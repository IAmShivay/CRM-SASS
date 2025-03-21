import { Features } from "./Features";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Pricing } from "./Pricing";
import { Testimonials } from "./Testimonials";
const page = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
                <Hero />
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
                    <Features />
                    <Pricing />
                    <Testimonials />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default page;
