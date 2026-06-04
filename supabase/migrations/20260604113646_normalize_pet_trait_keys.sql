-- Normalize pet_species_traits to the canonical question trait keys.
-- The pet matching function reads user_traits, so pet traits must use the same
-- keys produced by question_traits.

-- comfort_seeker -> comfort
UPDATE public.pet_species_traits
SET trait_key = 'comfort'
WHERE trait_key = 'comfort_seeker';

-- planner -> plan. If the species already has plan, keep the stronger affinity
-- and remove the duplicate planner row.
UPDATE public.pet_species_traits p
SET affinity_score = GREATEST(p.affinity_score, pl.affinity_score)
FROM public.pet_species_traits pl
WHERE p.species_id = pl.species_id
  AND p.trait_key = 'plan'
  AND pl.trait_key = 'planner';

DELETE FROM public.pet_species_traits pl
WHERE pl.trait_key = 'planner'
  AND EXISTS (
    SELECT 1
    FROM public.pet_species_traits p
    WHERE p.species_id = pl.species_id
      AND p.trait_key = 'plan'
  );

UPDATE public.pet_species_traits
SET trait_key = 'plan'
WHERE trait_key = 'planner';
