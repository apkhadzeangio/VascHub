import React from 'react'

const defaultLabels = {
  plural: 'ჩანაწერი',
  singular: 'ჩანაწერი',
}

const defaultCollectionLabels = {
  posts: {
    plural: 'სტატია',
    singular: 'სტატია',
  },
}

export const PageRange: React.FC<{
  className?: string
  collection?: keyof typeof defaultCollectionLabels
  collectionLabels?: {
    plural?: string
    singular?: string
  }
  currentPage?: number
  limit?: number
  totalDocs?: number
}> = (props) => {
  const {
    className,
    collection,
    collectionLabels: collectionLabelsFromProps,
    currentPage,
    limit,
    totalDocs,
  } = props

  let indexStart = ((currentPage || 1) - 1) * (limit || 1) + 1
  if (totalDocs && indexStart > totalDocs) indexStart = 0

  let indexEnd = (currentPage || 1) * (limit || 1)
  if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs

  const { plural, singular } =
    collectionLabelsFromProps ||
    (collection ? defaultCollectionLabels[collection] : undefined) ||
    defaultLabels ||
    {}

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {(typeof totalDocs === 'undefined' || totalDocs === 0) &&
        'გამოქვეყნებული სტატიები ჯერ არ არის.'}
      {typeof totalDocs !== 'undefined' &&
        totalDocs > 0 &&
        `ნაჩვენებია ${indexStart}${indexStart > 0 ? `–${indexEnd}` : ''}; სულ ${totalDocs} ${
          totalDocs > 1 ? plural : singular
        }`}
    </div>
  )
}
