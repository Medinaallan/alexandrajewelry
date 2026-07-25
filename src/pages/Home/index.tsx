import { HeroSection } from '../../components/home/HeroSection';
import { FeaturesSection } from '../../components/home/FeaturesSection';
import { CategoriesSection } from '../../components/home/CategoriesSection';
import { FeaturedProducts } from '../../components/home/FeaturedProducts';
import { BannerSection } from '../../components/home/BannerSection';
import { TestimonialsSection } from '../../components/home/TestimonialsSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <CategoriesSection />
      <FeaturedProducts />
      <BannerSection />
      <TestimonialsSection />
    </main>
  );
}
