class Album < ApplicationRecord
  has_many :tracks, dependent: :destroy

  def as_json(options = {})
    super(options.merge(methods: :track_count))
  end

  def track_count
    tracks.size
  end
end
