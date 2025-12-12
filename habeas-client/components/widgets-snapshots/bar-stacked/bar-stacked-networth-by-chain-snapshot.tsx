'use client';

import BarStackedNetworthByChain from '@/components/widgets/bar-stacked/bar-stacked-networth-by-chain';

export default function BarStackedNetworthByChainSnapshot() {

  const addresses = [
    "0x3f5eddad52c665a4aa011cd11a21e1d5107d7862",
    "0x26de4ebffbe8d3d632a292c972e3594efc2eceed",
    "0x1a07dceefeebba3d1873e2b92bef190d2f11c3cb",
    "0x7c780b8a63ee9b7d0f985e8a922be38a1f7b2141",
    "0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041",
    "0x37ed06d71dffb97b6e89469ebf29552da46e52fa",
    "0x008f84b4f7b625636dd3e75045704b077d8db445",
    "0x4aba01fb8e1f6bfe80c56deb367f19f35df0f4ae",
    "0xe37dd9a535c1d3c9fc33e3295b7e08bd1c42218d",
    "0x10e13f11419165beb0f456ec8a230899e4013bbd"
  ];
  const dates = [
    "2025-02-01",
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
    "2025-06-01",
    "2025-07-01",
    "2025-08-01",
    "2025-09-01",
    "2025-10-01"
  ]

  return (
        <BarStackedNetworthByChain
          addresses={addresses}
          dates={dates}
        />
  );
}

