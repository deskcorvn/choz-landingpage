import type { Post } from '@/payload-types';
import ZStationBlogSection from './ZStationBlogSection';
import ZStationBusinessSection from './ZStationBusinessSection';
import ZStationChannelSection from './ZStationChannelSection';
import ZStationExperienceSection from './ZStationExperienceSection';
import ZStationHero from './ZStationHero';
import ZStationNewsletterSection from './ZStationNewsletterSection';
import ZStationTestimonialsSection from './ZStationTestimonialsSection';
import ZStationTrustedSection from './ZStationTrustedSection';
import ZStationUserBenefitSection from './ZStationUserBenefitSection';
import ZStationVideoSection from './ZStationVideoSection';
import ZStationMapWrapper from './ZStationMapWrapper';

export default function ZStationLandingPage({ posts }: { posts?: Post[] }) {
	return (
		<main className='min-h-screen overflow-hidden bg-white text-foreground'>
			<ZStationHero />
			<ZStationTrustedSection />
			<ZStationChannelSection />
			<ZStationBusinessSection />
			<ZStationMapWrapper />
			<ZStationUserBenefitSection />
			<ZStationVideoSection />
			<ZStationTestimonialsSection />
			<ZStationExperienceSection />
			<ZStationBlogSection posts={posts} />
			<ZStationNewsletterSection />
		</main>
	);
}

