'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Footer } from '@/components/landing-page/footer';
import { PointerHighlight } from '@/components/ui/pointer-highlight';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

// Static hero for fast initial paint (no framer-motion)
import { StaticHero } from '@/components/landing-page/hero/static-hero';

// Lazy load animated components to avoid blocking initial render
const AnimatedHero = dynamic(
  () => import('@/components/landing-page/hero/animated-hero').then(mod => mod.AnimatedHero),
  { ssr: false }
);

const FloatingNavbar = dynamic(
  () => import('@/components/landing-page/floating-navbar').then(mod => mod.FloatingNavbar),
  { ssr: false }
);

const FeaturesGrid = dynamic(
  () => import('@/components/landing-page/features/features-grid').then(mod => mod.FeaturesGrid),
  { loading: () => <div className="min-h-[600px] animate-pulse bg-muted/10 rounded-lg" /> }
);

const LampDemo = dynamic(
  () => import('@/components/landing-page/vulniq-lamp').then(mod => mod.LampDemo),
  { loading: () => <div className="min-h-[400px]" /> }
);

const CTASection = dynamic(
  () => import('@/components/landing-page/cta-section').then(mod => mod.CTASection),
  { loading: () => <div className="min-h-[300px]" /> }
);

const FAQSection = dynamic(
  () => import('@/components/landing-page/faq-section').then(mod => mod.FAQSection),
  { loading: () => <div className="min-h-[400px]" /> }
);

const BlogSection = dynamic(
  () => import('@/components/landing-page/blog-section').then(mod => mod.BlogSection),
  { loading: () => <div className="min-h-[400px]" /> }
);

const InfiniteMovingCardsDemo = dynamic(
  () => import('@/components/infinite-moving-cards-demo'),
  { loading: () => <div className="min-h-[200px]" /> }
);

const FlipWordsDemo = dynamic(
  () => import('@/components/flip-words-demo').then(mod => mod.FlipWordsDemo),
  { loading: () => <div className="min-h-[100px]" /> }
);

const CardDemo = dynamic(
  () => import('@/components/ui/cards-demo-3'),
  { loading: () => <div className="min-h-[400px]" /> }
);

const LogoLoop = dynamic(
  () => import('@/components/ui/logo-loop').then(mod => mod.LogoLoop),
  { ssr: false, loading: () => <div className="h-16" /> }
);

// Inline SVG icons to avoid loading entire react-icons library (saves ~3MB)
const IconNextjs = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 0-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/>
  </svg>
);

const IconDocker = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186h-2.12a.186.186 0 0 0-.185.185v1.888c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/>
  </svg>
);

const IconReact = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38a2.167 2.167 0 0 0-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44a23.476 23.476 0 0 0-3.107-.534A23.892 23.892 0 0 0 12.769 4.7c1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442a22.73 22.73 0 0 0-3.113.538 15.02 15.02 0 0 1-.254-1.42c-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87a25.64 25.64 0 0 1-4.412.005 26.64 26.64 0 0 1-1.183-1.86c-.372-.64-.71-1.29-1.018-1.946a25.17 25.17 0 0 1 1.013-1.954c.38-.66.773-1.286 1.18-1.868A25.245 25.245 0 0 1 12 8.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933a25.952 25.952 0 0 0-1.345-2.32zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493a23.966 23.966 0 0 0-1.1-2.98c.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98a23.142 23.142 0 0 0-1.086 2.964c-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39a25.819 25.819 0 0 0 1.341-2.338zm-9.945.02c.24.377.48.763.705 1.16.225.39.435.788.636 1.18-.7.103-1.37.24-2.016.39.18-.63.406-1.285.675-1.94zm4.985 2.898c.462.468.91.988 1.35 1.556-.44-.02-.89-.034-1.345-.034-.46 0-.92.01-1.36.034.44-.572.895-1.096 1.355-1.556zm-3.65-.752c.46-.007.93-.007 1.4-.003h1.42c.34.08.67.188.98.32a25.61 25.61 0 0 1 2.54 3.62c-1.59 1.473-3.08 2.278-4.092 2.278-.225 0-.406-.044-.556-.128-.669-.384-.955-1.84-.73-3.71.05-.46.142-.944.25-1.438a23.567 23.567 0 0 0 -.213-.94zm-3.87-1.15c-.255-.658-.49-1.312-.676-1.948.64-.15 1.315-.284 2.015-.388-.466.6-.906 1.238-1.34 1.91zm9.945-2.04a25.95 25.95 0 0 0-1.342 2.338c.7-.1 1.37-.24 2.016-.39-.186-.64-.41-1.29-.674-1.948z"/>
  </svg>
);

const IconGithub = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const IconTailwind = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>
  </svg>
);

const IconAws = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.256-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.1 2.1 0 0 1-.263.104.488.488 0 0 1-.135.024c-.12 0-.18-.08-.18-.263v-.391c0-.136.016-.239.056-.303a.498.498 0 0 1 .2-.152 4.1 4.1 0 0 1 .94-.343 4.629 4.629 0 0 1 1.166-.136c.894 0 1.55.203 1.971.607.415.405.63.999.63 1.789v2.357h.008zm-3.238 1.205c.263 0 .535-.048.822-.144.287-.096.543-.271.758-.51a1.2 1.2 0 0 0 .319-.534c.056-.2.088-.439.088-.718v-.345a6.555 6.555 0 0 0-.735-.136 6.03 6.03 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.391.518-.391.909 0 .367.095.639.295.823.191.192.47.287.784.287zm6.406.638c-.152 0-.256-.024-.32-.08-.063-.048-.118-.16-.168-.311l-1.876-6.18a1.275 1.275 0 0 1-.08-.32c0-.127.064-.199.191-.199h.783c.16 0 .264.024.32.08.064.048.112.16.16.311l1.342 5.284 1.245-5.284c.04-.16.088-.263.151-.311a.549.549 0 0 1 .328-.08h.638c.16 0 .264.024.328.08.063.048.12.16.151.311l1.261 5.348 1.381-5.348c.048-.16.104-.263.16-.311a.516.516 0 0 1 .32-.08h.742c.127 0 .2.064.2.199 0 .04-.009.08-.017.128a1.225 1.225 0 0 1-.064.2l-1.923 6.18c-.048.16-.104.263-.168.311a.514.514 0 0 1-.319.08h-.687c-.159 0-.263-.024-.327-.08-.063-.056-.12-.16-.152-.32l-1.236-5.148-1.23 5.14c-.04.16-.087.264-.151.32-.064.056-.176.08-.327.08h-.687zm10.256.263a4.81 4.81 0 0 1-1.11-.128c-.359-.088-.639-.184-.83-.288a.472.472 0 0 1-.199-.167.456.456 0 0 1-.048-.2v-.407c0-.183.072-.271.207-.271a.517.517 0 0 1 .16.024 3.284 3.284 0 0 0 1.814 0 1.616 1.616 0 0 0 .591-.24c.168-.104.295-.24.383-.407a1.09 1.09 0 0 0 .136-.535c0-.2-.056-.375-.168-.527a1.569 1.569 0 0 0-.527-.4l-1.03-.527c-.367-.191-.639-.439-.814-.742a1.79 1.79 0 0 1-.264-.942c0-.271.056-.519.168-.742.112-.223.264-.415.455-.575a2.118 2.118 0 0 1 .678-.383c.263-.088.55-.128.862-.128.152 0 .31.008.462.024.16.016.31.04.462.072.144.032.279.072.407.112.128.04.231.08.32.12a.527.527 0 0 1 .199.16.42.42 0 0 1 .049.215v.375c0 .183-.072.279-.207.279-.072 0-.191-.032-.358-.096a4.167 4.167 0 0 0-1.524 0 1.272 1.272 0 0 0-.479.199.876.876 0 0 0-.287.335.91.91 0 0 0-.096.423c0 .2.064.383.191.543.128.16.335.311.623.455l1.006.487c.359.183.622.423.79.719.168.295.256.623.256.982 0 .279-.048.535-.152.766a1.716 1.716 0 0 1-.424.583c-.183.167-.407.295-.678.383-.279.088-.582.128-.91.128zM21.408 15.15c-.263.176-.534.367-.8.575a5.968 5.968 0 0 0-.718.654 3.997 3.997 0 0 0-.518.742 2.048 2.048 0 0 0-.208.815c0 .271.088.463.263.583.175.12.39.175.646.175.311 0 .59-.063.838-.191a2.1 2.1 0 0 0 .671-.55c.039-.063.063-.127.087-.199a.67.67 0 0 0 .032-.215v-2.389h-.293zm-2.855 2.42a2.75 2.75 0 0 1-.64-.168.606.606 0 0 1-.335-.423 2.193 2.193 0 0 1-.064-.583c0-.439.096-.838.279-1.197.184-.359.432-.686.742-.982.303-.296.647-.567 1.022-.807.376-.24.766-.447 1.17-.623V13.1c0-.447-.08-.77-.248-.97-.167-.2-.446-.295-.838-.295a2.24 2.24 0 0 0-.67.095c-.207.063-.415.144-.63.24-.207.095-.39.183-.55.263a.867.867 0 0 1-.368.12.294.294 0 0 1-.263-.12 .423.423 0 0 1-.096-.278v-.368c0-.2.08-.367.248-.494.168-.136.399-.256.694-.359a4.6 4.6 0 0 1 .975-.24 6.21 6.21 0 0 1 1.063-.087c.598 0 1.085.128 1.46.383.376.256.566.702.566 1.341v5.348h-.742c-.311 0-.503-.12-.575-.359l-.08-.343a4.23 4.23 0 0 1-.575.447c-.2.128-.407.232-.622.311-.216.08-.44.136-.678.168-.24.032-.488.048-.75.048a2.49 2.49 0 0 1-.622-.072z"/>
  </svg>
);

const IconNode = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.998 24c-.321 0-.641-.084-.922-.247L8.14 22.016c-.438-.245-.224-.332-.08-.383.657-.229.79-.281 1.49-.681.074-.04.17-.025.244.018l2.26 1.341c.082.045.198.045.273 0l8.81-5.084c.082-.048.133-.145.133-.245V6.895c0-.104-.051-.199-.137-.249l-8.802-5.077c-.082-.045-.19-.045-.272 0L3.255 6.646c-.088.05-.14.147-.14.249v10.083c0 .1.052.194.137.242l2.414 1.393c1.31.654 2.11-.116 2.11-.892V7.786c0-.144.113-.257.256-.257h1.115c.139 0 .255.113.255.257v9.935c0 1.749-.952 2.754-2.608 2.754-.51 0-.91 0-2.03-.551l-2.313-1.33a1.85 1.85 0 0 1-.922-1.6V6.895c0-.658.351-1.273.922-1.6l8.807-5.09a1.912 1.912 0 0 1 1.844 0l8.804 5.09c.572.327.923.942.923 1.6v10.083c0 .658-.35 1.271-.923 1.6l-8.804 5.087c-.28.163-.6.247-.922.247z"/>
  </svg>
);

const IconJs = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
  </svg>
);

const IconCss = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z"/>
  </svg>
);

const IconWebstorm = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M0 0v24h24V0H0zm2.97 2.697h18.06v18.606H2.97V2.697zm1.98 15.39h6.93v1.32H4.95v-1.32zm.83-11.22l1.2.48c.18.36.42.66.72.9.36.24.84.36 1.44.36.54 0 .96-.12 1.26-.3.3-.24.48-.54.48-.96 0-.36-.12-.66-.36-.9-.24-.24-.66-.42-1.26-.6l-.66-.18c-.66-.18-1.2-.42-1.56-.72-.42-.36-.6-.84-.6-1.44 0-.66.24-1.2.72-1.56.48-.42 1.14-.6 1.98-.6.72 0 1.32.12 1.74.42.48.24.78.6 1.02 1.08l-1.2.48c-.12-.24-.3-.48-.54-.6-.24-.18-.6-.24-.96-.24-.42 0-.78.06-1.02.24-.24.18-.36.42-.36.72 0 .3.12.54.36.72.24.18.54.3.96.42l.78.18c.78.18 1.38.48 1.74.84.36.36.54.84.54 1.44 0 .72-.24 1.26-.72 1.68-.48.42-1.2.6-2.1.6-.84 0-1.56-.18-2.1-.54-.54-.3-.9-.72-1.14-1.26zm7.98.12l1.32-.18c.18.72.42 1.26.78 1.56.36.3.84.48 1.44.48.54 0 .96-.12 1.26-.36.3-.24.42-.54.42-.84 0-.24-.06-.42-.18-.54-.12-.12-.3-.24-.54-.3l-1.02-.24c-.9-.18-1.5-.48-1.86-.84-.36-.36-.54-.84-.54-1.44 0-.66.24-1.2.72-1.62.48-.42 1.14-.66 2.04-.66.78 0 1.44.18 1.92.54.48.36.78.84.96 1.5l-1.32.18c-.12-.42-.3-.72-.6-.96-.3-.18-.66-.3-1.14-.3s-.84.12-1.14.3c-.24.18-.36.42-.36.72 0 .18.06.36.18.48.12.12.3.24.6.3l1.14.24c.84.18 1.44.48 1.8.84.36.36.54.84.54 1.44 0 .72-.3 1.32-.84 1.74-.54.42-1.26.66-2.16.66-.9 0-1.62-.24-2.16-.66-.54-.42-.9-1.02-1.02-1.8z"/>
  </svg>
);

const IconShadcn = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M12 2L2 19.5h20L12 2Z" />
  </svg>
);

// Tech logos using inline SVGs instead of react-icons
const techLogos = [
  { node: <IconNextjs className="w-6 h-6" />, title: "Next.js", href: "https://nextjs.org" },
  { node: <IconDocker className="w-6 h-6" />, title: "Docker", href: "https://www.docker.com" },
  { node: <IconReact className="w-6 h-6" />, title: "React", href: "https://react.dev" },
  { node: <IconGithub className="w-6 h-6" />, title: "GitHub", href: "https://github.com" },
  { node: <IconTailwind className="w-6 h-6" />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { node: <IconAws className="w-6 h-6" />, title: "AWS", href: "https://aws.amazon.com" },
  { node: <IconWebstorm className="w-6 h-6" />, title: "WebStorm", href: "https://www.jetbrains.com/webstorm/" },
  { node: <IconNode className="w-6 h-6" />, title: "Node.js", href: "https://nodejs.org" },
  { node: <IconJs className="w-6 h-6" />, title: "JavaScript", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { node: <IconCss className="w-6 h-6" />, title: "CSS3", href: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
  { node: <IconShadcn className="w-6 h-6" />, title: "Shadcn UI", href: "https://ui.shadcn.com" },
];

export default function LandingPage() {
  const scrollContainerRef = useRef(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Defer animation loading until after first paint
  useEffect(() => {
    // Use requestIdleCallback to load animations after initial render
    const loadAnimations = () => setIsHydrated(true);
    
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(loadAnimations, { timeout: 500 });
    } else {
      setTimeout(loadAnimations, 100);
    }
  }, []);

  return (
    <ScrollArea className="h-screen w-full" viewportRef={scrollContainerRef}>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[var(--brand-accent)]/20 flex flex-col overflow-hidden relative w-full max-w-[100vw]">
        {/* Background effects */}
        <div className="fixed inset-0 mesh-gradient pointer-events-none" />
        <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

        <FloatingNavbar />

        <main id="main-content" className="w-full max-w-[100vw] overflow-hidden">
          {/* Hero Section - Static first, then animated */}
          {isHydrated ? (
            <AnimatedHero scrollContainerRef={scrollContainerRef} />
          ) : (
            <StaticHero />
          )}

          {/* Features Section */}
          <section id="features" className="relative z-10 py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32 pb-4 sm:pb-6 md:pb-8 lg:pb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1fb6cf]/[0.02] to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 relative w-full">
              {/* Header - CSS animation instead of framer-motion initially */}
              <div className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-16 xl:mb-20 animate-fade-in-up">
                <div className="text-center px-2">
                  <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-muted-foreground mb-3 sm:mb-4 md:mb-6 font-medium">
                    Vulnerability management is critical.
                  </p>
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                        The next frontier is{" "}
                        <PointerHighlight
                            containerClassName="px-1"
                            rectangleClassName="border-[var(--brand-accent)]/60 bg-[var(--brand-accent)]/10"
                            pointerClassName="text-[var(--brand-accent)]"
                        >
                            <span className="gradient-text">agentic remediation</span>
                        </PointerHighlight>
                    </div>
                </div>
                <div className="accent-line-center w-12 sm:w-16 md:w-20 lg:w-24 mx-auto mt-4 sm:mt-6 md:mt-8" />
              </div>

              <FeaturesGrid />

              <div className="max-w-4xl mx-auto mt-12 sm:mt-16 md:mt-20">
                <h3 className="text-center text-sm font-semibold text-muted-foreground mb-8 tracking-wider">
                  Built with modern technologies
                </h3>
                <div className="h-[60px] relative overflow-hidden">
                  <LogoLoop
                    logos={techLogos}
                    speed={50}
                    direction="left"
                    logoHeight={40}
                    gap={60}
                    hoverSpeed={0}
                    scaleOnHover
                    fadeOut={false}
                    ariaLabel="Technology stack"
                  />
                </div>
              </div>

              <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 w-full">
                <FlipWordsDemo />
              </div>

              <div id="use-cases" className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 w-full">
                <InfiniteMovingCardsDemo />
              </div>

              <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 w-full">
                <CardDemo />
              </div>
            </div>
          </section>

          {/* Lamp Section */}
          <section id="about" className="relative z-10 w-full overflow-hidden">
            <LampDemo />
          </section>

          {/* FAQ Section */}
          <section id="faq" className="relative z-10 w-full overflow-hidden">
            <FAQSection />
          </section>

          {/* Blog Section */}
          <section id="blog" className="relative z-10 w-full overflow-hidden">
            <BlogSection />
          </section>

          {/* CTA Section */}
          <section id="connect" className="relative z-10 w-full overflow-hidden">
            <CTASection />
          </section>
        </main>

        <Footer onScrollToTop={scrollToTop} />
      </div>
    </ScrollArea>
  );
}
