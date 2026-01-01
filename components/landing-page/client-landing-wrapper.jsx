'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Footer } from '@/components/landing-page/footer';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { StickyFeedback } from '@/components/landing-page/sticky-feedback';

// Lazy load the code demo to overlay on the hero after hydration
const SecurityCodeDemo = dynamic(
  () => import('@/components/landing-page/hero/security-code-demo').then(mod => mod.SecurityCodeDemo),
  { ssr: false }
);

// Lazy load animated/interactive components (client-only)
const FloatingNavbar = dynamic(
  () => import('@/components/landing-page/floating-navbar').then(mod => mod.FloatingNavbar),
  { ssr: false }
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

const UseCasesScrollReveal = dynamic(
  () => import('@/components/landing-page/use-cases-scroll-reveal'),
  { loading: () => <div className="min-h-[100vh]" /> }
);

const HoverExpandPanels = dynamic(
  () => import('@/components/ui/hover-expand-panels'),
  { ssr: false, loading: () => <div className="min-h-[400px]" /> }
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

// Inline SVG icons to avoid loading entire react-icons library
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
  <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
    <path d="M14.313 22.211c0.55 0.025 1.112 0.043 1.681 0.043 0.575 0 1.143-0.012 1.7-0.043-0.557 0.72-1.107 1.357-1.689 1.964l0.008-0.008c-0.579-0.6-1.135-1.238-1.659-1.902l-0.041-0.054zM8.615 21.411c1.083 0.275 2.404 0.509 3.752 0.653l0.131 0.011c0.825 1.133 1.659 2.13 2.554 3.068l-0.011-0.012c-1.311 1.463-3.080 2.491-5.081 2.86l-0.055 0.008c-0.004 0-0.008 0-0.012 0-0.248 0-0.482-0.061-0.687-0.169l0.008 0.004c-0.832-0.475-1.193-2.292-0.912-4.627 0.067-0.575 0.177-1.18 0.312-1.797zM23.398 21.398c0.118 0.474 0.229 1.078 0.308 1.692l0.009 0.086c0.287 2.334-0.067 4.149-0.892 4.634-0.184 0.102-0.404 0.162-0.638 0.162-0.023 0-0.046-0.001-0.069-0.002l0.003 0c-2.053-0.375-3.821-1.396-5.129-2.841l-0.007-0.008c0.879-0.923 1.707-1.918 2.466-2.965l0.058-0.084c1.476-0.154 2.799-0.392 4.088-0.717l-0.197 0.042zM9.784 17.666c0.25 0.49 0.512 0.978 0.8 1.468q0.431 0.731 0.881 1.428c-0.868-0.127-1.706-0.287-2.507-0.482 0.225-0.787 0.507-1.602 0.825-2.416zM22.212 17.641c0.331 0.821 0.612 1.64 0.845 2.434-0.8 0.196-1.645 0.362-2.519 0.487 0.3-0.469 0.6-0.952 0.881-1.447 0.281-0.487 0.544-0.985 0.795-1.475zM7.619 12.292c0.436 1.478 0.904 2.714 1.449 3.906l-0.075-0.182c-0.466 1.005-0.927 2.234-1.305 3.499l-0.052 0.205c-0.706-0.217-1.274-0.43-1.827-0.669l0.115 0.044c-2.164-0.921-3.564-2.132-3.564-3.092s1.4-2.177 3.564-3.094c0.525-0.225 1.1-0.428 1.694-0.617zM24.358 12.287c0.605 0.187 1.18 0.396 1.718 0.622 2.164 0.925 3.564 2.134 3.564 3.094-0.006 0.96-1.406 2.174-3.57 3.093-0.525 0.225-1.1 0.427-1.693 0.616-0.44-1.483-0.908-2.718-1.451-3.912l0.076 0.188c0.464-1.004 0.926-2.233 1.303-3.498l0.053-0.206zM20.53 11.444c0.869 0.129 1.706 0.287 2.507 0.484-0.225 0.79-0.506 1.602-0.825 2.416-0.25-0.487-0.512-0.978-0.8-1.467-0.281-0.49-0.581-0.967-0.881-1.432zM11.458 11.444c-0.3 0.471-0.6 0.953-0.88 1.45-0.281 0.487-0.544 0.977-0.794 1.467-0.331-0.82-0.612-1.637-0.845-2.433 0.8-0.187 1.643-0.354 2.518-0.482zM16 11.126c0.925 0 1.846 0.042 2.752 0.116q0.761 1.091 1.478 2.324 0.697 1.2 1.272 2.432c-0.385 0.819-0.807 1.637-1.266 2.437-0.475 0.825-0.966 1.61-1.475 2.337-0.91 0.079-1.832 0.122-2.762 0.122-0.925 0-1.846-0.044-2.752-0.116-0.507-0.727-1.002-1.505-1.478-2.324q-0.697-1.2-1.272-2.432c0.379-0.821 0.807-1.641 1.266-2.442 0.475-0.825 0.966-1.607 1.475-2.334 0.91-0.080 1.832-0.122 2.762-0.122zM15.981 7.845c0.58 0.6 1.136 1.237 1.659 1.901l0.040 0.053c-0.55-0.025-1.112-0.042-1.681-0.042-0.575 0-1.143 0.012-1.7 0.042 0.556-0.72 1.106-1.357 1.689-1.964l-0.008 0.008zM9.88 4.033c2.053 0.376 3.82 1.397 5.129 2.841l0.007 0.008c-0.879 0.924-1.707 1.919-2.466 2.968l-0.058 0.084c-1.475 0.153-2.798 0.389-4.086 0.714l0.196-0.042c-0.14-0.612-0.244-1.205-0.317-1.774-0.287-2.334 0.067-4.149 0.892-4.632 0.206-0.097 0.447-0.157 0.701-0.165l0.003-0zM22.090 4.008v0.008c0.013-0 0.028-0.001 0.044-0.001 0.239 0 0.464 0.059 0.662 0.163l-0.008-0.004c0.832 0.477 1.193 2.293 0.912 4.629-0.067 0.575-0.177 1.181-0.312 1.799-1.085-0.278-2.406-0.513-3.754-0.656l-0.128-0.011c-0.826-1.134-1.66-2.131-2.555-3.070l0.012 0.012c1.311-1.46 3.077-2.488 5.074-2.859l0.056-0.009zM22.096 2.646c-2.442 0.371-4.556 1.557-6.1 3.268l-0.008 0.009c-1.555-1.71-3.669-2.888-6.051-3.245l-0.056-0.007c-0.013-0-0.029-0-0.045-0-0.491 0-0.952 0.129-1.351 0.355l0.014-0.007c-1.718 0.991-2.103 4.079-1.216 7.954-3.804 1.175-6.278 3.053-6.278 5.032 0 1.987 2.487 3.87 6.302 5.036-0.88 3.89-0.487 6.983 1.235 7.973 0.378 0.217 0.832 0.344 1.315 0.344 0.022 0 0.044-0 0.065-0.001l-0.003 0c2.442-0.371 4.556-1.558 6.1-3.27l0.008-0.009c1.555 1.711 3.669 2.889 6.051 3.246l0.056 0.007c0.015 0 0.034 0 0.052 0 0.488 0 0.947-0.128 1.344-0.351l-0.014 0.007c1.717-0.99 2.103-4.078 1.216-7.954 3.79-1.165 6.264-3.047 6.264-5.029 0-1.987-2.487-3.87-6.302-5.039 0.88-3.886 0.487-6.982-1.235-7.973-0.382-0.219-0.84-0.348-1.328-0.348-0.013 0-0.026 0-0.039 0l0.002-0zM18.787 16.005c0 1.543-1.251 2.794-2.794 2.794s-2.794-1.251-2.794-2.794c0-1.543 1.251-2.794 2.794-2.794 0.772 0 1.47 0.313 1.976 0.818v0c0.506 0.506 0.818 1.204 0.818 1.976 0 0 0 0 0 0v0z"/>
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
  <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
    <path d="M4.51 7.687c0 .197.02.357.058.475.042.117.096.245.17.384a.233.233 0 01.037.123c0 .053-.032.107-.1.16l-.336.224a.255.255 0 01-.138.048c-.054 0-.107-.026-.16-.074a1.652 1.652 0 01-.192-.251 4.137 4.137 0 01-.164-.315c-.416.491-.937.737-1.565.737-.447 0-.804-.129-1.064-.385-.261-.256-.394-.598-.394-1.025 0-.454.16-.822.484-1.1.325-.278.756-.416 1.304-.416.18 0 .367.016.564.042.197.027.4.07.612.118v-.39c0-.406-.085-.689-.25-.854-.17-.166-.458-.246-.868-.246-.186 0-.377.022-.574.07a4.23 4.23 0 00-.575.181 1.525 1.525 0 01-.186.07.326.326 0 01-.085.016c-.075 0-.112-.054-.112-.166v-.262c0-.085.01-.15.037-.186a.399.399 0 01.15-.113c.185-.096.409-.176.67-.24.26-.07.537-.101.83-.101.633 0 1.096.144 1.394.432.293.288.442.726.442 1.314v1.73h.01zm-2.161.811c.175 0 .356-.032.548-.096.192-.064.362-.182.505-.342a.848.848 0 00.181-.341c.032-.129.054-.283.054-.465V7.03a4.43 4.43 0 00-.49-.09 3.996 3.996 0 00-.5-.033c-.357 0-.617.07-.793.214-.176.144-.26.347-.26.614 0 .25.063.437.196.566.128.133.314.197.559.197zm4.273.577c-.096 0-.16-.016-.202-.054-.043-.032-.08-.106-.112-.208l-1.25-4.127a.938.938 0 01-.048-.214c0-.085.042-.133.127-.133h.522c.1 0 .17.016.207.053.043.032.075.107.107.208l.894 3.535.83-3.535c.026-.106.058-.176.101-.208a.365.365 0 01.213-.053h.426c.1 0 .17.016.212.053.043.032.08.107.102.208l.84 3.578.92-3.578a.459.459 0 01.107-.208.347.347 0 01.208-.053h.495c.085 0 .133.043.133.133 0 .027-.006.054-.01.086a.768.768 0 01-.038.133l-1.283 4.127c-.031.107-.069.177-.111.209a.34.34 0 01-.203.053h-.457c-.101 0-.17-.016-.213-.053-.043-.038-.08-.107-.101-.214L8.213 5.37l-.82 3.439c-.026.107-.058.176-.1.213-.043.038-.118.054-.213.054h-.458zm6.838.144a3.51 3.51 0 01-.82-.096c-.266-.064-.473-.134-.612-.214-.085-.048-.143-.101-.165-.15a.38.38 0 01-.031-.149v-.272c0-.112.042-.166.122-.166a.3.3 0 01.096.016c.032.011.08.032.133.054.18.08.378.144.585.187.213.042.42.064.633.064.336 0 .596-.059.777-.176a.575.575 0 00.277-.508.52.52 0 00-.144-.373c-.095-.102-.276-.193-.537-.278l-.772-.24c-.388-.123-.676-.305-.851-.545a1.275 1.275 0 01-.266-.774c0-.224.048-.422.143-.593.096-.17.224-.32.384-.438.16-.122.34-.213.553-.277.213-.064.436-.091.67-.091.118 0 .24.005.357.021.122.016.234.038.346.06.106.026.208.052.303.085.096.032.17.064.224.096a.461.461 0 01.16.133.289.289 0 01.047.176v.251c0 .112-.042.171-.122.171a.552.552 0 01-.202-.064 2.428 2.428 0 00-1.022-.208c-.303 0-.543.048-.708.15-.165.1-.25.256-.25.475 0 .149.053.277.16.379.106.101.303.202.585.293l.756.24c.383.123.66.294.825.513.165.219.244.47.244.748 0 .23-.047.437-.138.619a1.435 1.435 0 01-.388.47c-.165.133-.362.23-.591.299-.24.075-.49.112-.761.112z"/>
    <path fillRule="evenodd" d="M14.465 11.813c-1.75 1.297-4.294 1.986-6.481 1.986-3.065 0-5.827-1.137-7.913-3.027-.165-.15-.016-.353.18-.235 2.257 1.313 5.04 2.109 7.92 2.109 1.941 0 4.075-.406 6.039-1.239.293-.133.543.192.255.406z" clipRule="evenodd"/>
    <path fillRule="evenodd" d="M15.194 10.98c-.223-.287-1.479-.138-2.048-.069-.17.022-.197-.128-.043-.24 1-.705 2.645-.502 2.836-.267.192.24-.053 1.89-.99 2.68-.143.123-.281.06-.217-.1.212-.53.686-1.72.462-2.003z" clipRule="evenodd"/>
  </svg>
);

const IconNode = ({ className }) => (
  <svg viewBox="-1.5 0 24 24" fill="currentColor" className={className}>
    <path d="m10.639 24c-.001 0-.002 0-.003 0-.339 0-.656-.091-.928-.251l.009.005-2.937-1.737c-.438-.246-.224-.332-.08-.383.506-.159.946-.365 1.352-.618l-.024.014c.028-.013.06-.02.094-.02.046 0 .089.014.125.038l-.001-.001 2.256 1.339c.039.021.086.034.136.034s.097-.013.138-.035l-.002.001 8.794-5.077c.081-.05.134-.138.134-.238 0-.001 0-.001 0-.002v-10.147c-.001-.101-.055-.19-.136-.239l-.001-.001-8.791-5.072c-.039-.022-.086-.035-.135-.035s-.096.013-.137.036l.001-.001-8.789 5.073c-.083.049-.138.138-.139.24v10.149c0 .101.055.188.137.234l.001.001 2.41 1.392c1.307.654 2.107-.116 2.107-.889v-10.022c0-.14.114-.254.254-.254h.003 1.115.001c.14 0 .254.113.254.254v10.022c0 1.745-.95 2.746-2.604 2.746-.02 0-.043.001-.066.001-.725 0-1.402-.205-1.976-.56l-2.29-1.318c-.556-.328-.922-.923-.922-1.605v-10.151c.001-.68.368-1.273.914-1.595l.009-.005 8.795-5.082c.267-.149.585-.236.924-.236s.658.088.934.241l-.01-.005 8.794 5.082c.555.327.921.92.923 1.6v10.15c-.001.681-.368 1.276-.915 1.6l-.009.005-8.792 5.078c-.264.155-.582.246-.922.246-.002 0-.005 0-.007 0z"/>
    <path d="m13.356 17.009c-3.848 0-4.655-1.766-4.655-3.249v-.001c0-.14.113-.253.253-.253h.002 1.137.001c.127 0 .232.093.252.214v.001c.171 1.158.683 1.742 3.01 1.742 1.853 0 2.64-.419 2.64-1.402 0-.567-.223-.987-3.102-1.269-2.406-.24-3.894-.77-3.894-2.695 0-1.774 1.496-2.833 4-2.833 2.818 0 4.212.978 4.388 3.076.001.007.001.015.001.022 0 .141-.114.254-.254.254h-1.133c-.12 0-.221-.085-.246-.198v-.002c-.274-1.218-.94-1.607-2.746-1.607-2.023 0-2.258.705-2.258 1.232 0 .64.278.826 3.009 1.187 2.702.358 3.986.863 3.986 2.762-.004 1.919-1.601 3.017-4.388 3.017z"/>
  </svg>
);

// Build tech logos with icons
// Static tech logo configuration
const TECH_LOGOS = [
  { title: "Next.js", href: "https://nextjs.org" },
  { title: "Docker", href: "https://www.docker.com" },
  { title: "React", href: "https://react.dev" },
  { title: "GitHub", href: "https://github.com" },
  { title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { title: "AWS", href: "https://aws.amazon.com" },
  { title: "Node.js", href: "https://nodejs.org" },
];

function buildTechLogos() {
  const iconMap = {
    "Next.js": IconNextjs,
    "Docker": IconDocker,
    "React": IconReact,
    "GitHub": IconGithub,
    "Tailwind CSS": IconTailwind,
    "AWS": IconAws,
    "Node.js": IconNode,
  };
  
  return TECH_LOGOS.map(logo => ({
    ...logo,
    node: iconMap[logo.title] ? 
      React.createElement(iconMap[logo.title], { className: "w-6 h-6" }) : 
      null
  })).filter(logo => logo.node);
}

/**
 * HeroCodeDemoOverlay - Renders the code demo as an overlay on the hero section.
 * Uses a portal-like pattern to overlay on the existing ServerHero placeholder.
 */
function HeroCodeDemoOverlay() {
  const [mounted, setMounted] = useState(false);
  // Use a unique key to ensure the SecurityCodeDemo starts fresh on mount
  const [instanceKey] = useState(() => Date.now());
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  // Find the placeholder element in ServerHero and overlay on it
  const placeholder = document.getElementById('hero-demo-placeholder');
  if (!placeholder) return null;
  
  return createPortal(
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <SecurityCodeDemo key={instanceKey} className="relative glow-accent w-full" />
    </motion.div>,
    placeholder
  );
}

/**
 * Client wrapper for the landing page.
 * Handles scroll, navigation, and interactive animations.
 * Server-rendered content is passed as children.
 */
export function ClientLandingWrapper({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const logoNodes = buildTechLogos();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loadAnimations = () => setIsHydrated(true);
    
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(loadAnimations, { timeout: 500 });
    } else {
      setTimeout(loadAnimations, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[var(--brand-accent)]/20 flex flex-col relative w-full">
        {/* Background effects */}
        <div className="fixed inset-0 mesh-gradient pointer-events-none" />
        <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

        <FloatingNavbar />

        <main id="main-content" className="w-full">
          {/* Hero section - always render ServerHero, overlay code demo after hydration */}
          {React.Children.toArray(children)[0]}
          
          {/* Portal overlay for code demo - renders inside ServerHero's placeholder */}
          {isHydrated && <HeroCodeDemoOverlay />}

          {/* Server-rendered features section (second child) */}
          {React.Children.toArray(children)[1]}

          {/* Tech logos section */}
          {isHydrated && (
            <div className="max-w-4xl mx-auto mt-12 sm:mt-16 md:mt-20 px-4">
              <h3 className="text-center text-base sm:text-lg font-semibold text-muted-foreground mb-8 tracking-wider">
                Built with modern technologies
              </h3>
              <div className="h-[60px] relative overflow-hidden">
                <LogoLoop
                  logos={logoNodes}
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
          )}

          {/* Interactive sections */}
          <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12">
            <FlipWordsDemo />
          </div>

          <div id="use-cases" className="w-full">
            <UseCasesScrollReveal />
          </div>

          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12">
            <HoverExpandPanels defaultActive={0} activeGrow={7} />
          </div>

          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 mb-16 sm:mb-20 md:mb-24 lg:mb-32 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12">
            <CardDemo />
          </div>

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
      
      {/* Sticky Feedback Widget */}
      <StickyFeedback />
    </div>
  );
}
