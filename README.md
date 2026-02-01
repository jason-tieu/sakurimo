# Sakurimo - University Tracker

A comprehensive university tracker built with Next.js, TypeScript, Tailwind CSS, and Framer Motion. Manage your academic journey with unit tracking, assignment management, and study planning.

## 🚀 Features

- **Dashboard**: Overview of assignments, exams, and academic progress
- **Unit Management**: Track enrolled units and academic information
- **Assignment Tracking**: Manage assignments with due dates and status
- **Exam Scheduler**: View exam timetables and locations
- **Grade Tracking**: Monitor academic performance and GPA
- **Study Planner**: Plan study sessions and track learning progress
- **Calendar Integration**: Sync with external calendar systems
- **Notifications**: Stay updated with important academic alerts
- **Resource Management**: Organize unit materials and links
- **Modern Design**: Clean, minimal design with dark mode support
- **Responsive**: Fully responsive across all devices
- **Performance**: Optimized for speed with static export

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui
- **Content**: MDX
- **Deployment**: Vercel (static export)

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/username/sakurimo.git
   cd sakurimo
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Building and Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Static Export

```bash
npm run build
# The static files will be generated in the 'out' directory
```

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

## 📝 Usage

### Getting Started

1. **Add Your Units**: Navigate to the Units page and add your enrolled units
2. **Create Assignments**: Add assignments with due dates and track their progress
3. **Schedule Exams**: Input exam dates, times, and locations
4. **Track Grades**: Monitor your academic performance and GPA
5. **Plan Study Sessions**: Use the study planner to organize your learning
6. **Sync Calendar**: Connect with external calendar systems for seamless integration

### Data Management

- **Export Data**: Download your data as JSON from Settings
- **Import Data**: Import data from other university tracking systems
- **Backup**: Regular backups ensure your data is safe

## 🎨 Customization

### Colors and Branding

Edit the brand colors in `src/app/globals.css`:

```css
:root {
  --brand: oklch(0.6 0.2 15); /* Primary brand color */
  --accent-brand: oklch(0.5 0.15 270); /* Accent brand color */
}
```

### Typography

The site uses Inter font by default. To change fonts, update `src/app/layout.tsx`:

```typescript
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});
```

### Adding New Pages

1. **Create a new page** in `src/app/(routes)/`

   ```bash
   mkdir src/app/(routes)/new-page
   touch src/app/(routes)/new-page/page.tsx
   ```

2. **Add navigation** in `src/components/header.tsx`

### Custom Components

Create reusable components in `src/components/`:

```typescript
// src/components/my-component.tsx
interface MyComponentProps {
  title: string;
  description: string;
}

export function MyComponent({ title, description }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
SITE_URL=https://your-domain.com
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### SEO Configuration

Update metadata in `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: 'Your Name - Your Title',
  description: 'Your description',
  // ... other metadata
};
```

### Analytics

To add Google Analytics, uncomment the configuration in `src/app/layout.tsx` and add your GA ID to environment variables.

## 📁 Project Structure

```
sakurimo/
├── src/
│   ├── app/
│   │   ├── units/
│   │   ├── assignments/
│   │   ├── exams/
│   │   ├── grades/
│   │   ├── timetable/
│   │   ├── calendar/
│   │   ├── planner/
│   │   ├── resources/
│   │   ├── integrations/
│   │   ├── notifications/
│   │   ├── settings/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── shell/
│   │   └── ...
│   └── lib/
│       ├── types.ts
│       ├── mock.ts
│       └── utils.ts
├── public/
│   └── images/
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## 🚀 Performance

The site is optimized for performance with:

- **Static Export**: Pre-rendered pages for fast loading
- **Image Optimization**: Next.js Image component with WebP support
- **Code Splitting**: Automatic code splitting for optimal bundle sizes
- **Font Optimization**: Preloaded fonts with `font-display: swap`
- **Lighthouse Score**: 95+ across all metrics

## 🔒 Security

Security features include:

- **Security Headers**: HSTS, X-Frame-Options, CSP
- **Content Security Policy**: Restrictive CSP for enhanced security
- **No External Scripts**: Self-contained with no external dependencies
- **HTTPS Only**: Enforced through security headers

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Deployment platform

---

Built with ❤️ for students everywhere
